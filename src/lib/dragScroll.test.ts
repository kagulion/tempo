import { describe, expect, it } from 'vitest';

import { exceedsDragThreshold, wheelScrollDelta } from './dragScroll';

describe('exceedsDragThreshold', () => {
	it('небольшой сдвиг — клик, большой — перетаскивание', () => {
		expect(exceedsDragThreshold(3)).toBe(false);
		expect(exceedsDragThreshold(5)).toBe(false);
		expect(exceedsDragThreshold(-6)).toBe(true);
		expect(exceedsDragThreshold(4, 4)).toBe(true);
	});
});

describe('wheelScrollDelta', () => {
	const base = { deltaX: 0, deltaY: 40, scrollLeft: 10, scrollWidth: 500, clientWidth: 200 };

	it('вертикальное колесо превращается в горизонтальную прокрутку', () => {
		expect(wheelScrollDelta(base)).toBe(40);
		expect(wheelScrollDelta({ ...base, deltaY: -40 })).toBe(-40);
	});

	it('горизонтальный жест не трогаем', () => {
		expect(wheelScrollDelta({ ...base, deltaX: 60 })).toBe(0);
	});

	it('некуда прокручивать — страница прокручивается сама', () => {
		expect(wheelScrollDelta({ ...base, scrollWidth: 200 })).toBe(0);
		expect(wheelScrollDelta({ ...base, scrollLeft: 300 })).toBe(0);
		expect(wheelScrollDelta({ ...base, scrollLeft: 0, deltaY: -40 })).toBe(0);
	});
});
