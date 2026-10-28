import { describe, expect, it } from 'vitest';

import {
	rampDuration,
	rampSpeed,
	scaledRampDuration,
	secondsPerRevolution,
	spinDownMs,
	spinUpMs,
	targetSpeed
} from './spin';

describe('secondsPerRevolution', () => {
	it('компакт-диск — 1,8 с на оборот, винил и белая этикетка — 3,6 с', () => {
		expect(secondsPerRevolution('cd', 1)).toBeCloseTo(1.8, 5);
		expect(secondsPerRevolution('vinyl', 1)).toBeCloseTo(3.6, 5);
		expect(secondsPerRevolution('label', 1)).toBeCloseTo(3.6, 5);
	});

	it('скорость видео ускоряет вращение', () => {
		expect(secondsPerRevolution('cd', 2)).toBeCloseTo(0.9, 5);
		expect(secondsPerRevolution('vinyl', 0.5)).toBeCloseTo(7.2, 5);
	});
});

describe('targetSpeed', () => {
	it('играет — обороты в секунду, иначе ноль', () => {
		expect(targetSpeed('cd', 1, true)).toBeCloseTo(1 / 1.8, 5);
		expect(targetSpeed('vinyl', 1, true)).toBeCloseTo(1 / 3.6, 5);
		expect(targetSpeed('cd', 1, false)).toBe(0);
	});
});

describe('rampDuration и rampSpeed', () => {
	it('разгон и торможение берут своё время', () => {
		expect(rampDuration(0, 0.5)).toBe(spinUpMs);
		expect(rampDuration(0.5, 0)).toBe(spinDownMs);
		expect(rampDuration(0.5, 0.5)).toBe(0);
	});

	it('скорость идёт от начала к цели монотонно', () => {
		expect(rampSpeed(0, 1, 0, 800)).toBe(0);
		expect(rampSpeed(0, 1, 800, 800)).toBe(1);
		expect(rampSpeed(0, 1, 2000, 800)).toBe(1);
		const mid = rampSpeed(0, 1, 400, 800);
		expect(mid).toBeGreaterThan(0.5);
		expect(mid).toBeLessThan(1);
		expect(rampSpeed(1, 0, 400, 1200)).toBeGreaterThan(0);
		expect(rampSpeed(1, 0, 400, 1200)).toBeLessThan(1);
	});

	it('нулевая длительность — сразу цель', () => {
		expect(rampSpeed(0, 1, 0, 0)).toBe(1);
	});
});

describe('scaledRampDuration', () => {
	it('полный разгон занимает полное время, малое изменение скорости — меньше', () => {
		expect(scaledRampDuration(0, 0.5, 0.5)).toBe(spinUpMs);
		expect(scaledRampDuration(0.25, 0.5, 0.5)).toBe(spinUpMs / 2);
		expect(scaledRampDuration(0.5, 0.5, 0.5)).toBe(0);
	});
});
