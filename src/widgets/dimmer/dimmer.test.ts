import { describe, expect, it } from 'vitest';

import { dimmerOpacity, parseDimmer } from './dimmer';

describe('затемнение', () => {
	it('читает значения в диапазоне', () => {
		expect(parseDimmer(0)).toBe(0);
		expect(parseDimmer(40)).toBe(40);
		expect(parseDimmer(90)).toBe(90);
	});

	it('округляет до шага', () => {
		expect(parseDimmer(42)).toBe(40);
		expect(parseDimmer(43)).toBe(45);
	});

	it('всё остальное отбрасывает', () => {
		expect(parseDimmer(-5)).toBeUndefined();
		expect(parseDimmer(95)).toBeUndefined();
		expect(parseDimmer(NaN)).toBeUndefined();
		expect(parseDimmer(Infinity)).toBeUndefined();
		expect(parseDimmer('40')).toBeUndefined();
		expect(parseDimmer(null)).toBeUndefined();
		expect(parseDimmer({ value: 40 })).toBeUndefined();
	});

	it('переводит процент в opacity', () => {
		expect(dimmerOpacity(0)).toBe(0);
		expect(dimmerOpacity(50)).toBe(0.5);
		expect(dimmerOpacity(90)).toBe(0.9);
	});
});
