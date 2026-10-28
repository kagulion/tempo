import { describe, expect, it } from 'vitest';

import { afterEnd, defaultSettings, parseSettings } from './settings';

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
			rate: 1.5,
			repeat: 'all',
			discId: 'aaaaaaaaaaa',
			showVideo: true
		};
		expect(parseSettings(saved)).toEqual(saved);
	});

	it('плохое поле сбрасывается, остальные остаются', () => {
		const result = parseSettings({
			volume: 500,
			muted: 'да',
			rate: 3,
			repeat: 'x',
			discId: ''
		});
		expect(result).toEqual({ ...defaultSettings, volume: 100 });
	});
});

describe('старое поле rpm', () => {
	it('принимается и игнорируется, остальные поля остаются', () => {
		const result = parseSettings({ volume: 40, rpm: 45, rate: 1.5, repeat: 'all' });
		expect(result).toEqual({ ...defaultSettings, volume: 40, rate: 1.5, repeat: 'all' });
		expect(result).not.toHaveProperty('rpm');
	});
});

describe('старое поле overlays', () => {
	it('принимается и игнорируется, остальные поля остаются', () => {
		const result = parseSettings({
			volume: 40,
			overlays: ['clock'],
			repeat: 'one',
			showVideo: true
		});
		expect(result).toEqual({ ...defaultSettings, volume: 40, repeat: 'one', showVideo: true });
		expect(result).not.toHaveProperty('overlays');
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
