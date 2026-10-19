import { describe, expect, it } from 'vitest';

import { anyTimerRunning } from './running';

describe('anyTimerRunning', () => {
	it('находит идущий таймер среди режимов', () => {
		expect(
			anyTimerRunning({
				pomodoro: { startedAt: null, elapsed: 5 },
				stopwatch: { startedAt: 1700000000000, elapsed: 0 }
			})
		).toBe(true);
	});

	it('на паузе, пусто и мусор — не идёт', () => {
		expect(anyTimerRunning({ pomodoro: { startedAt: null } })).toBe(false);
		expect(anyTimerRunning({})).toBe(false);
		expect(anyTimerRunning(null)).toBe(false);
		expect(anyTimerRunning('x')).toBe(false);
	});
});
