import { describe, expect, it } from 'vitest';

import { formatTime, resumeFrom, seekTarget } from './progress';

describe('formatTime', () => {
	it('минуты и часы', () => {
		expect(formatTime(0)).toBe('0:00');
		expect(formatTime(75)).toBe('1:15');
		expect(formatTime(3723.9)).toBe('1:02:03');
	});

	it('мусор — ноль', () => {
		expect(formatTime(Number.NaN)).toBe('0:00');
		expect(formatTime(-5)).toBe('0:00');
	});
});

describe('seekTarget', () => {
	it('не выходит за начало и конец', () => {
		expect(seekTarget(100, 10, 3600)).toBe(110);
		expect(seekTarget(5, -10, 3600)).toBe(0);
		expect(seekTarget(3595, 10, 3600)).toBe(3600);
		expect(seekTarget(100, 10, 0)).toBe(110);
	});
});

describe('resumeFrom', () => {
	it('запомненное место важнее времени из ссылки', () => {
		expect(resumeFrom(120.7, 30)).toBe(120);
		expect(resumeFrom(undefined, 30)).toBe(30);
		expect(resumeFrom(undefined, undefined)).toBeUndefined();
	});

	it('почти в конце — сначала', () => {
		expect(resumeFrom(3598, 30, 3600)).toBe(30);
		expect(resumeFrom(3500, 30, 3600)).toBe(3500);
	});
});
