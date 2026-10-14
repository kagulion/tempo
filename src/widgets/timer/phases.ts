// Логика фаз таймера без React: смена фаз помидоро, догон после перезагрузки, тексты уведомлений.
// Состояние и эффекты — в useTimer.ts. Тесты — в phases.test.ts

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
export type TimerRun = {
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
export type TimerRuns = Partial<Record<TimerMode, TimerRun>>;

// Длинный перерыв — после каждого 4-го раунда
export const longBreakEvery = 4;

export const minute = 60_000;

export const phaseText: Record<Phase, string> = {
	work: 'Работа',
	shortBreak: 'Короткий перерыв',
	longBreak: 'Длинный перерыв'
};

export function elapsedOf(run: TimerRun, now: number) {
	return run.elapsed + (run.startedAt === null ? 0 : Math.max(0, now - run.startedAt));
}

export function phaseDuration(phase: Phase, settings: TimerSettings) {
	return settings[phase] * minute;
}

// Что идёт после фазы. null — помидоро закончился: после последнего раунда перерыва нет
export function nextPhase(
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
export function settle(run: TimerRun, settings: TimerSettings, now: number) {
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

// Заменяет таймер одного режима, остальные не трогает. null — таймер режима сброшен
export function replaceRun(runs: TimerRuns, mode: TimerMode, next: TimerRun | null): TimerRuns {
	if (next === (runs[mode] ?? null)) return runs;
	const result = { ...runs };
	if (next) result[mode] = next;
	else delete result[mode];
	return result;
}

// Текст уведомления о том, что началось после сигнала
export function announcement(run: TimerRun | null, mode: TimerMode, settings: TimerSettings) {
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
