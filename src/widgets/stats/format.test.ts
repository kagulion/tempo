import { describe, expect, it } from 'vitest';

import { formatDays, formatDuration } from './format';

describe('formatDays', () => {
	it.each([
		[1, '1 день'],
		[2, '2 дня'],
		[4, '4 дня'],
		[5, '5 дней'],
		[11, '11 дней'],
		[12, '12 дней'],
		[14, '14 дней'],
		[21, '21 день'],
		[22, '22 дня'],
		[111, '111 дней'],
		[0, '0 дней']
	])('%i → %s', (count, text) => {
		expect(formatDays(count)).toBe(text);
	});
});

describe('formatDuration', () => {
	it.each([
		[30_000, '< 1 мин'],
		[45 * 60_000, '45 мин'],
		[60 * 60_000, '1 ч'],
		[150 * 60_000, '2 ч 30 мин']
	])('%i мс → %s', (ms, text) => {
		expect(formatDuration(ms)).toBe(text);
	});
});
