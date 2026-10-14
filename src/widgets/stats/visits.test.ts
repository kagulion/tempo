import { describe, expect, it } from 'vitest';

import { advance, dayKey, daysBetween, maxGapMs, type VisitStats } from './visits';

// Полдень по местному времени: тесты не зависят от часового пояса машины
function at(day: number, hours = 12, minutes = 0) {
	return new Date(2026, 9, day, hours, minutes).getTime();
}

function stats(overrides: Partial<VisitStats> = {}): VisitStats {
	return {
		lastDay: '2026-10-10',
		streak: 3,
		best: 5,
		todayMs: 60_000,
		totalMs: 600_000,
		lastTick: at(10),
		...overrides
	};
}

describe('dayKey и daysBetween', () => {
	it('день по местному времени, даже поздно вечером', () => {
		expect(dayKey(at(10, 23, 59))).toBe('2026-10-10');
		expect(dayKey(at(1, 0, 1))).toBe('2026-10-01');
	});

	it('разница в календарных днях', () => {
		expect(daysBetween('2026-10-10', '2026-10-11')).toBe(1);
		expect(daysBetween('2026-09-30', '2026-10-02')).toBe(2);
		expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1);
	});
});

describe('advance', () => {
	it('первый визит: серия в один день, время не считается', () => {
		expect(advance(null, at(10), true)).toEqual({
			lastDay: '2026-10-10',
			streak: 1,
			best: 1,
			todayMs: 0,
			totalMs: 0,
			lastTick: at(10)
		});
	});

	it('добавляет время с прошлой отметки', () => {
		const next = advance(stats(), at(10) + 1000, true);
		expect(next.todayMs).toBe(61_000);
		expect(next.totalMs).toBe(601_000);
		expect(next.lastTick).toBe(at(10) + 1000);
	});

	it('без countTime только отмечает заход', () => {
		const next = advance(stats(), at(10) + 1000, false);
		expect(next.todayMs).toBe(60_000);
		expect(next.lastTick).toBe(at(10) + 1000);
	});

	it('долгий разрыв (сайт был закрыт) не считается временем на сайте', () => {
		const next = advance(stats(), at(10) + maxGapMs + 1, true);
		expect(next.totalMs).toBe(600_000);
	});

	it('заход на следующий день продолжает серию и обнуляет время за день', () => {
		const next = advance(stats(), at(11), false);
		expect(next).toMatchObject({ lastDay: '2026-10-11', streak: 4, best: 5, todayMs: 0 });
	});

	it('новая серия обновляет рекорд', () => {
		const next = advance(stats({ streak: 5 }), at(11), false);
		expect(next).toMatchObject({ streak: 6, best: 6 });
	});

	it('пропущенный день начинает серию заново', () => {
		const next = advance(stats(), at(12), false);
		expect(next).toMatchObject({ streak: 1, best: 5 });
	});

	it('время на стыке полуночи уходит в новый день', () => {
		// 23:59:45 → 00:00:15
		const lastTick = at(10, 23, 59) + 45_000;
		const next = advance(stats({ lastTick }), lastTick + 30_000, true);
		expect(next).toMatchObject({ lastDay: '2026-10-11', todayMs: 30_000, totalMs: 630_000 });
	});

	it('не меняет исходный объект', () => {
		const saved = stats();
		advance(saved, at(11), true);
		expect(saved).toEqual(stats());
	});
});
