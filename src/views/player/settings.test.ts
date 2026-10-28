import { describe, expect, it } from 'vitest';

import { afterEnd, defaultSettings, parseSettings, toggleOverlay } from './settings';

describe('parseSettings', () => {
	it('не объект — undefined', () => {
		expect(parseSettings(null)).toBeUndefined();
		expect(parseSettings([])).toBeUndefined();
		expect(parseSettings('x')).toBeUndefined();
	});

	it('пустой объект даёт значения по умолчанию', () => {
		expect(parseSettings({})).toEqual(defaultSettings);
	});

	it('читает правильные поля', () => {
		const saved = {
			volume: 40,
			muted: true,
			rpm: 45,
			rate: 1.5,
			repeat: 'all',
			overlays: ['clock'],
			discId: 'aaaaaaaaaaa',
			showVideo: true
		};
		expect(parseSettings(saved)).toEqual(saved);
	});

	it('плохое поле сбрасывается, остальные остаются', () => {
		const result = parseSettings({
			volume: 500,
			muted: 'да',
			rpm: 78,
			rate: 3,
			repeat: 'x',
			overlays: ['clock', 'clock', 'неизвестный'],
			discId: ''
		});
		expect(result).toEqual({ ...defaultSettings, volume: 100, overlays: ['clock'] });
	});
});

describe('toggleOverlay', () => {
	it('включает и выключает', () => {
		expect(toggleOverlay([], 'clock')).toEqual(['clock']);
		expect(toggleOverlay(['clock'], 'clock')).toEqual([]);
	});
});

describe('afterEnd', () => {
	it('повтор одной, всех и конец списка', () => {
		expect(afterEnd('one', true)).toBe('replay');
		expect(afterEnd('all', true)).toBe('next');
		expect(afterEnd('off', false)).toBe('next');
		expect(afterEnd('off', true)).toBe('stop');
	});
});
