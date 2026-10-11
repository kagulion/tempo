import { useEffect, useState } from 'react';

import { duckBefore, restoreAfter } from '@/lib/ducking';

import { chimeLength, notify, playChime, requestNotifications, unlockSound } from './signal';

export type TimerMode = 'pomodoro' | 'countdown' | 'stopwatch';
export type Phase = 'work' | 'shortBreak' | 'longBreak';
export type TimerStatus = 'idle' | 'running' | 'paused';

// Длительности в минутах
export type TimerSettings = {
	mode: TimerMode;
	work: number;
	shortBreak: number;
	longBreak: number;
	rounds: number;
	countdown: number;
	sound: boolean;
};

// Идущий или поставленный на паузу таймер. Время считается по меткам Date.now(), а не по тикам:
// так оно не сбивается в фоновой вкладке и переживает перезагрузку страницы
type TimerRun = {
	mode: TimerMode;
	phase: Phase;
	// Номер рабочего раунда с единицы. Перерыв относится к раунду, после которого он идёт
	round: number;
	// Длительность текущей фазы в мс, у секундомера null
	duration: number | null;
	// Сколько мс набежало до последнего запуска
	elapsed: number;
	// Когда запущен; null — на паузе
	startedAt: number | null;
};

// У каждого режима свой таймер: на паузе можно уйти на другую вкладку и вернуться.
// Идти может только один — пока он идёт, остальные вкладки заблокированы
type TimerRuns = Partial<Record<TimerMode, TimerRun>>;

// Длинный перерыв — после каждого 4-го раунда
export const longBreakEvery = 4;

const minute = 60_000;
const settingsKey = 'tempo:timer-settings';
const runsKey = 'tempo:timer-runs';

const defaultSettings: TimerSettings = {
	mode: 'pomodoro',
	work: 25,
	shortBreak: 5,
	longBreak: 15,
	rounds: 4,
	countdown: 10,
	sound: true
};

function load<T>(key: string, fallback: T): T {
	try {
		const saved = localStorage.getItem(key);
		return saved ? JSON.parse(saved) : fallback;
	} catch {
		return fallback;
	}
}

function save(key: string, value: unknown) {
	try {
		if (value === null) localStorage.removeItem(key);
		else localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// Хранилище недоступно (приватный режим) — таймер живёт до перезагрузки
	}
}

function elapsedOf(run: TimerRun, now: number) {
	return run.elapsed + (run.startedAt === null ? 0 : Math.max(0, now - run.startedAt));
}

function phaseDuration(phase: Phase, settings: TimerSettings) {
	return settings[phase] * minute;
}

// Что идёт после фазы. null — помидоро закончился: после последнего раунда перерыва нет
function nextPhase(
	run: TimerRun,
	settings: TimerSettings
): Pick<TimerRun, 'phase' | 'round'> | null {
	if (run.phase !== 'work') return { phase: 'work', round: run.round + 1 };
	if (run.round >= settings.rounds) return null;
	return {
		phase: run.round % longBreakEvery === 0 ? 'longBreak' : 'shortBreak',
		round: run.round
	};
}

// Полная длительность помидоро в мс: все раунды и перерывы между ними
export function pomodoroTotal(settings: TimerSettings) {
	let total = settings.rounds * settings.work;
	for (let round = 1; round < settings.rounds; round++) {
		total += round % longBreakEvery === 0 ? settings.longBreak : settings.shortBreak;
	}
	return total * minute;
}

// Доводит таймер до момента now. Пока вкладка была закрыта, могло пройти несколько фаз:
// каждая следующая стартует ровно в момент конца предыдущей, а не когда мы это заметили
function settle(run: TimerRun, settings: TimerSettings, now: number) {
	let current: TimerRun | null = run;
	while (current && current.duration !== null && elapsedOf(current, now) >= current.duration) {
		const endedAt: number = current.startedAt! + current.duration - current.elapsed;
		const next: ReturnType<typeof nextPhase> =
			current.mode === 'pomodoro' ? nextPhase(current, settings) : null;
		current = next && {
			...current,
			...next,
			duration: phaseDuration(next.phase, settings),
			elapsed: 0,
			startedAt: endedAt
		};
	}
	return current;
}

export const phaseText: Record<Phase, string> = {
	work: 'Работа',
	shortBreak: 'Короткий перерыв',
	longBreak: 'Длинный перерыв'
};

// Текст уведомления о том, что началось после сигнала
function announcement(run: TimerRun | null, mode: TimerMode, settings: TimerSettings) {
	if (!run) {
		return mode === 'pomodoro'
			? { title: 'Помидоро завершён', body: `Все раунды пройдены: ${settings.rounds}` }
			: { title: 'Время вышло', body: 'Обратный отсчёт закончился' };
	}
	const minutes = Math.round((run.duration ?? 0) / minute);
	return run.phase === 'work'
		? { title: `${phaseText.work}: раунд ${run.round}`, body: `${minutes} мин — за дело` }
		: { title: phaseText[run.phase], body: `${minutes} мин отдыха` };
}

export function useTimer() {
	const [settings, setSettings] = useState(() => ({
		...defaultSettings,
		...load<Partial<TimerSettings>>(settingsKey, {})
	}));
	const [runs, setRuns] = useState(() => load<TimerRuns>(runsKey, {}));
	const [now, setNow] = useState(Date.now);

	useEffect(() => save(settingsKey, settings), [settings]);
	useEffect(() => save(runsKey, runs), [runs]);

	// Идущий таймер главнее выбранной вкладки: уйти с неё, пока он идёт, нельзя
	const mode = Object.values(runs).find((item) => item.startedAt !== null)?.mode ?? settings.mode;
	const run = runs[mode] ?? null;
	const running = run?.startedAt != null;

	// Меняет таймер текущего режима, остальные не трогает
	function setRun(update: TimerRun | null | ((current: TimerRun | null) => TimerRun | null)) {
		setRuns((all) => {
			const current = all[mode] ?? null;
			const next = typeof update === 'function' ? update(current) : update;
			if (next === current) return all;
			const result = { ...all };
			if (next) result[mode] = next;
			else delete result[mode];
			return result;
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
		setRun(next);
		if (settings.sound) {
			playChime();
			restoreAfter(chimeLength);
		}
		const { title, body } = announcement(next, run.mode, settings);
		notify(title, body);
	}, [run, now, settings]);

	function start() {
		unlockSound();
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
		unlockSound();
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
