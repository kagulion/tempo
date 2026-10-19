import { useEffect, useState } from 'react';

import { usePersistentState } from '@/hooks/usePersistentState';
import { unlockAudio } from '@/lib/audio';
import { duckBefore, restoreAfter } from '@/lib/ducking';
import { isRecord, storageKeys } from '@/lib/storage';

import {
	announcement,
	elapsedOf,
	minute,
	nextPhase,
	phaseAnnouncement,
	phaseDuration,
	replaceRun,
	settle,
	type TimerRun,
	type TimerRuns,
	type TimerSettings,
	type TimerStatus
} from './phases';
import { setTimerMessage, useTimerMessage } from './message';
import { chimeLength, notify, playChime, requestNotifications } from './signal';

const defaultSettings: TimerSettings = {
	mode: 'pomodoro',
	work: 25,
	shortBreak: 5,
	longBreak: 15,
	rounds: 4,
	countdown: 10,
	sound: true
};

// Настройки могли сохраниться до появления новых полей — недостающие берём по умолчанию
function parseSettings(saved: unknown): TimerSettings | undefined {
	return isRecord(saved) ? { ...defaultSettings, ...(saved as Partial<TimerSettings>) } : undefined;
}

function parseRuns(saved: unknown): TimerRuns | undefined {
	return isRecord(saved) ? (saved as TimerRuns) : undefined;
}

export function useTimer() {
	// Хранилище недоступно (приватный режим) — таймер живёт до перезагрузки
	const [settings, setSettings] = usePersistentState(
		storageKeys.timerSettings,
		defaultSettings,
		parseSettings
	);
	const [runs, setRuns] = usePersistentState<TimerRuns>(storageKeys.timerRuns, {}, parseRuns);
	const [now, setNow] = useState(Date.now);
	const message = useTimerMessage();

	// Идущий таймер главнее выбранной вкладки: уйти с неё, пока он идёт, нельзя
	const mode = Object.values(runs).find((item) => item.startedAt !== null)?.mode ?? settings.mode;
	const run = runs[mode] ?? null;
	const running = run?.startedAt != null;

	// Меняет таймер текущего режима, остальные не трогает
	function setRun(update: TimerRun | null | ((current: TimerRun | null) => TimerRun | null)) {
		setRuns((all) => {
			const current = all[mode] ?? null;
			return replaceRun(all, mode, typeof update === 'function' ? update(current) : update);
		});
	}

	// Пока таймер идёт, перерисовываемся чаще раза в секунду, чтобы цифры не «прыгали»
	useEffect(() => {
		if (!running) return;
		const id = setInterval(() => setNow(Date.now()), 250);
		return () => clearInterval(id);
	}, [running]);

	// Когда прозвучит сигнал. Музыка начинает затихать за 5 секунд до него. На паузе, у секундомера
	// и без звука сигнала не ждём — музыка играет как обычно
	const signalAt =
		settings.sound && run?.startedAt != null && run.duration !== null
			? run.startedAt + run.duration - run.elapsed
			: null;

	useEffect(() => duckBefore(signalAt), [signalAt]);

	// Фаза закончилась: переходим к следующей сами и подаём сигнал
	useEffect(() => {
		if (!run || run.duration === null || elapsedOf(run, now) < run.duration) return;
		const next = settle(run, settings, now);
		setRuns((all) => replaceRun(all, run.mode, next));
		if (settings.sound) {
			playChime();
			restoreAfter(chimeLength);
		}
		const { title, body } = announcement(next, run.mode, settings);
		notify(title, body);
		setTimerMessage(phaseAnnouncement(run, next, settings));
	}, [run, now, settings, setRuns]);

	function start() {
		unlockAudio();
		requestNotifications();
		const startedAt = Date.now();
		setNow(startedAt);
		setRun({
			mode,
			phase: 'work',
			round: 1,
			duration:
				mode === 'pomodoro'
					? phaseDuration('work', settings)
					: mode === 'countdown'
						? settings.countdown * minute
						: null,
			elapsed: 0,
			startedAt
		});
	}

	function pause() {
		const at = Date.now();
		setRun((current) =>
			current?.startedAt != null
				? { ...current, elapsed: elapsedOf(current, at), startedAt: null }
				: current
		);
	}

	function resume() {
		unlockAudio();
		const at = Date.now();
		setNow(at);
		setRun((current) =>
			current && current.startedAt === null ? { ...current, startedAt: at } : current
		);
	}

	function reset() {
		setRun(null);
	}

	// Пропустить фазу помидоро без сигнала. Следующая фаза сразу идёт, если таймер шёл
	function skip() {
		if (!run || run.mode !== 'pomodoro') return;
		const next = nextPhase(run, settings);
		const at = Date.now();
		setNow(at);
		setTimerMessage(
			phaseAnnouncement(
				run,
				next && { ...run, ...next, duration: phaseDuration(next.phase, settings) },
				settings
			)
		);
		setRun(
			next && {
				...run,
				...next,
				duration: phaseDuration(next.phase, settings),
				elapsed: 0,
				startedAt: running ? at : null
			}
		);
	}

	function changeSetting<K extends keyof TimerSettings>(key: K, value: TimerSettings[K]) {
		setSettings((current) => ({ ...current, [key]: value }));
	}

	const elapsed = run ? elapsedOf(run, now) : 0;
	const status: TimerStatus = !run ? 'idle' : running ? 'running' : 'paused';

	return {
		settings,
		message,
		changeSetting,
		mode,
		status,
		// Режимы, где таймер стоит на паузе: на их вкладках показываем отметку
		pausedModes: Object.values(runs)
			.filter((item) => item.startedAt === null)
			.map((item) => item.mode),
		phase: run?.phase ?? 'work',
		round: run?.round ?? 1,
		elapsed,
		// Сколько осталось в мс, у секундомера null
		remaining: run?.duration != null ? Math.max(0, run.duration - elapsed) : null,
		progress: run?.duration ? Math.min(1, elapsed / run.duration) : 0,
		start,
		pause,
		resume,
		reset,
		skip
	};
}
