import { describe, expect, it } from 'vitest';

import { initialOnboarding, parseOnboarding } from './onboarding';

const own = 'tempo:onboarding';

describe('parseOnboarding', () => {
	it('принимает только известные значения', () => {
		expect(parseOnboarding('pending')).toBe('pending');
		expect(parseOnboarding('done')).toBe('done');
		expect(parseOnboarding('x')).toBeUndefined();
		expect(parseOnboarding(true)).toBeUndefined();
		expect(parseOnboarding(null)).toBeUndefined();
	});
});

describe('initialOnboarding', () => {
	it('чистое хранилище — показываем', () => {
		expect(initialOnboarding([], own)).toBe('pending');
	});

	it('чужие ключи и свой собственный не считаются настройками', () => {
		expect(initialOnboarding(['theme', own], own)).toBe('pending');
	});

	it('любые сохранённые настройки tempo:* — старый посетитель', () => {
		expect(initialOnboarding(['tempo:wallpaper'], own)).toBe('done');
		expect(initialOnboarding(['tempo:visitor-id'], own)).toBe('done');
	});
});
