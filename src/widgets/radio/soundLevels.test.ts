import { describe, expect, it } from 'vitest';

import { bandLevels, barBands, createSilenceWatch, isSilentSpectrum } from './soundLevels';

describe('bandLevels', () => {
	it('даёт уровень на каждую полоску в пределах от 0.2 до 1', () => {
		const loud = new Uint8Array(128).fill(255);
		expect(bandLevels(loud)).toEqual(barBands.map(() => 1));
		const quiet = new Uint8Array(128);
		expect(bandLevels(quiet)).toEqual(barBands.map(() => 0.2));
	});

	it('каждая полоска смотрит на свои частоты', () => {
		const bytes = new Uint8Array(128);
		bytes[1] = 204;
		bytes[2] = 204;
		const [bass, low] = bandLevels(bytes);
		expect(bass).toBeCloseTo(0.8);
		expect(low).toBeLessThan(bass);
	});

	it('короткий спектр не ломает расчёт', () => {
		expect(bandLevels(new Uint8Array(3))).toHaveLength(barBands.length);
	});
});

describe('isSilentSpectrum', () => {
	it('нули — тишина, любое ненулевое значение — нет', () => {
		expect(isSilentSpectrum(new Uint8Array(8))).toBe(true);
		expect(isSilentSpectrum(new Uint8Array([0, 0, 1]))).toBe(false);
	});
});

describe('createSilenceWatch', () => {
	it('срабатывает после непрерывной тишины', () => {
		const watch = createSilenceWatch(3000);
		expect(watch(0, true)).toBe(false);
		expect(watch(2999, true)).toBe(false);
		expect(watch(3000, true)).toBe(true);
	});

	it('любой звук сбрасывает отсчёт', () => {
		const watch = createSilenceWatch(3000);
		watch(0, true);
		expect(watch(2000, false)).toBe(false);
		expect(watch(4000, true)).toBe(false);
		expect(watch(7000, true)).toBe(true);
	});
});
