import { describe, expect, it } from 'vitest';

import { flipTransform } from './flip';

const rect = (left: number, top: number, width: number, height: number) => ({
	left,
	top,
	width,
	height
});

describe('flipTransform', () => {
	it('сдвигает элемент на старое место', () => {
		expect(flipTransform(rect(100, 50, 200, 80), rect(10, 20, 200, 80))).toBe(
			'translate(90px, 30px) scale(1, 1)'
		);
	});

	it('масштабирует по отношению старого размера к новому', () => {
		expect(flipTransform(rect(0, 0, 400, 100), rect(0, 0, 200, 50))).toBe(
			'translate(0px, 0px) scale(2, 2)'
		);
	});

	it('при нулевом новом размере оставляет масштаб 1', () => {
		expect(flipTransform(rect(0, 0, 100, 100), rect(5, 5, 0, 0))).toBe(
			'translate(-5px, -5px) scale(1, 1)'
		);
	});
});
