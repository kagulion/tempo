import { describe, expect, it } from 'vitest';

import {
	announcement,
	elapsedOf,
	minute,
	nextPhase,
	phaseAnnouncement,
	pomodoroTotal,
	replaceRun,
	settle,
	type TimerRun,
	type TimerSettings
} from './phases';

const settings: TimerSettings = {
	mode: 'pomodoro',
	work: 25,
	shortBreak: 5,
	longBreak: 15,
	rounds: 4,
	countdown: 10,
	sound: true
};

function run(overrides: Partial<TimerRun> = {}): TimerRun {
	return {
		mode: 'pomodoro',
		phase: 'work',
		round: 1,
		duration: 25 * minute,
		elapsed: 0,
		startedAt: 0,
		...overrides
	};
}

describe('elapsedOf', () => {
	it('считает время с запуска плюс накопленное до паузы', () => {
		expect(elapsedOf(run({ elapsed: 1000, startedAt: 5000 }), 8000)).toBe(4000);
	});

	it('на паузе время не идёт', () => {
		expect(elapsedOf(run({ elapsed: 1000, startedAt: null }), 99_999)).toBe(1000);
	});

	it('часы, отведённые назад, не делают время отрицательным', () => {
		expect(elapsedOf(run({ startedAt: 5000 }), 1000)).toBe(0);
	});
});

describe('nextPhase', () => {
	it('после работы — короткий перерыв того же раунда', () => {
		expect(nextPhase(run(), settings)).toEqual({ phase: 'shortBreak', round: 1 });
	});

	it('после перерыва — работа следующего раунда', () => {
		expect(nextPhase(run({ phase: 'shortBreak', round: 1 }), settings)).toEqual({
			phase: 'work',
			round: 2
		});
	});

	it('после каждого 4-го раунда — длинный перерыв', () => {
		expect(nextPhase(run({ round: 4 }), { ...settings, rounds: 8 })).toEqual({
			phase: 'longBreak',
			round: 4
		});
	});

	it('после последнего раунда помидоро заканчивается без перерыва', () => {
		expect(nextPhase(run({ round: 4 }), settings)).toBeNull();
	});
});

describe('pomodoroTotal', () => {
	it('4 раунда по 25 минут и 3 коротких перерыва — 1 ч 55 мин', () => {
		expect(pomodoroTotal(settings)).toBe(115 * minute);
	});

	it('между 4-м и 5-м раундом длинный перерыв', () => {
		// 5 × 25 + 3 × 5 + 15
		expect(pomodoroTotal({ ...settings, rounds: 5 })).toBe(155 * minute);
	});
});

describe('settle', () => {
	it('не трогает фазу, которая ещё идёт', () => {
		const current = run();
		expect(settle(current, settings, 10 * minute)).toBe(current);
	});

	it('догоняет несколько фаз: каждая стартует в момент конца предыдущей', () => {
		// Работа 0–25, перерыв 25–30, сейчас 33-я минута — идёт работа второго раунда с 30-й
		expect(settle(run(), settings, 33 * minute)).toEqual(
			run({ phase: 'work', round: 2, startedAt: 30 * minute })
		);
	});

	it('учитывает время, накопленное до паузы', () => {
		// До паузы набежало 20 минут, после запуска в 100 — ещё 5: работа кончилась ровно в 105
		const resumed = run({ elapsed: 20 * minute, startedAt: 100 * minute });
		expect(settle(resumed, settings, 106 * minute)).toEqual(
			run({ phase: 'shortBreak', round: 1, duration: 5 * minute, startedAt: 105 * minute })
		);
	});

	it('после последней фазы помидоро возвращает null', () => {
		expect(settle(run({ round: 4 }), settings, 25 * minute)).toBeNull();
	});

	it('обратный отсчёт заканчивается одной фазой', () => {
		const countdown = run({ mode: 'countdown', duration: 10 * minute });
		expect(settle(countdown, settings, 10 * minute)).toBeNull();
	});

	it('секундомер не заканчивается никогда', () => {
		const stopwatch = run({ mode: 'stopwatch', duration: null });
		expect(settle(stopwatch, settings, 1000 * minute)).toBe(stopwatch);
	});
});

describe('replaceRun', () => {
	it('меняет таймер одного режима и не трогает остальные', () => {
		const countdown = run({ mode: 'countdown' });
		const next = run({ round: 2 });
		expect(replaceRun({ pomodoro: run(), countdown }, 'pomodoro', next)).toEqual({
			pomodoro: next,
			countdown
		});
	});

	it('null удаляет таймер режима', () => {
		expect(replaceRun({ pomodoro: run() }, 'pomodoro', null)).toEqual({});
	});

	it('без изменений возвращает тот же объект, чтобы React не перерисовывал', () => {
		const current = run();
		const runs = { pomodoro: current };
		expect(replaceRun(runs, 'pomodoro', current)).toBe(runs);
		expect(replaceRun({}, 'countdown', null)).toEqual({});
	});
});

describe('announcement', () => {
	it('о начале работы', () => {
		expect(announcement(run({ round: 2 }), 'pomodoro', settings)).toEqual({
			title: 'Работа: раунд 2',
			body: '25 мин — за дело'
		});
	});

	it('о начале перерыва', () => {
		expect(
			announcement(run({ phase: 'longBreak', duration: 15 * minute }), 'pomodoro', settings)
		).toEqual({ title: 'Длинный перерыв', body: '15 мин отдыха' });
	});

	it('о конце помидоро и обратного отсчёта', () => {
		expect(announcement(null, 'pomodoro', settings).title).toBe('Помидоро завершён');
		expect(announcement(null, 'countdown', settings).title).toBe('Время вышло');
	});
});

describe('phaseAnnouncement', () => {
	it('после работы объявляет перерыв', () => {
		const next = run({ phase: 'shortBreak', duration: 5 * minute });
		expect(phaseAnnouncement(run(), next, settings)).toBe('Работа закончена, перерыв 5 мин');
	});

	it('различает длинный перерыв', () => {
		const next = run({ phase: 'longBreak', round: 4, duration: 15 * minute });
		expect(phaseAnnouncement(run({ round: 4 }), next, settings)).toBe(
			'Работа закончена, длинный перерыв 15 мин'
		);
	});

	it('после перерыва объявляет новый раунд', () => {
		const prev = run({ phase: 'shortBreak', duration: 5 * minute });
		const next = run({ round: 2 });
		expect(phaseAnnouncement(prev, next, settings)).toBe(
			'Перерыв закончен, работа: раунд 2, 25 мин'
		);
	});

	it('в конце помидоро и отсчёта объявляет завершение', () => {
		expect(phaseAnnouncement(run({ round: 4 }), null, settings)).toBe(
			'Помидоро завершён, все раунды пройдены: 4'
		);
		expect(phaseAnnouncement(run({ mode: 'countdown' }), null, settings)).toBe('Время вышло');
	});
});
