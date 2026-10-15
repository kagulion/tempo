import { afterEach, describe, expect, it, vi } from 'vitest';

import {
	getNowPlaying,
	hasNowPlayingToggle,
	nowPlayingLabel,
	nowPlayingParts,
	registerNowPlayingToggle,
	setNowPlaying,
	subscribeNowPlaying,
	toggleNowPlaying
} from './nowPlaying';

const rock = { name: 'Rock', countrycode: 'DE', playing: true, audible: true };

afterEach(() => {
	setNowPlaying(null);
});

describe('nowPlayingParts', () => {
	it('отдаёт название и страну по отдельности', () => {
		expect(nowPlayingParts({ name: ' Jazz FM ', countrycode: 'DE' })).toEqual({
			name: 'Jazz FM',
			country: new Intl.DisplayNames(['ru'], { type: 'region' }).of('DE')
		});
	});

	it('пустое название заменяет на «Без названия», без кода страны страна пустая', () => {
		expect(nowPlayingParts({ name: '   ', countrycode: '' })).toEqual({
			name: 'Без названия',
			country: ''
		});
	});
});

describe('nowPlayingLabel', () => {
	it('склеивает название и страну через точку', () => {
		expect(nowPlayingLabel({ name: 'Radio Lounge', countrycode: 'DE' })).toBe(
			`Radio Lounge · ${new Intl.DisplayNames(['ru'], { type: 'region' }).of('DE')}`
		);
	});

	it('обрезает пробелы у названия', () => {
		expect(nowPlayingLabel({ name: '  Jazz FM  ', countrycode: '' })).toBe('Jazz FM');
	});

	it('пустое название заменяет на «Без названия»', () => {
		expect(nowPlayingLabel({ name: '   ', countrycode: '' })).toBe('Без названия');
	});

	it('без кода страны показывает только название', () => {
		expect(nowPlayingLabel({ name: 'Rock', countrycode: '' })).toBe('Rock');
	});
});

describe('nowPlaying store', () => {
	it('по умолчанию пусто, затем хранит станцию', () => {
		expect(getNowPlaying()).toBeNull();
		setNowPlaying(rock);
		expect(getNowPlaying()).toEqual(rock);
		setNowPlaying(null);
		expect(getNowPlaying()).toBeNull();
	});

	it('держит станцию на паузе', () => {
		setNowPlaying({ ...rock, playing: false, audible: false });
		expect(getNowPlaying()).toEqual({
			name: 'Rock',
			countrycode: 'DE',
			playing: false,
			audible: false
		});
	});

	it('сообщает подписчикам об изменении и не шлёт одинаковое значение', () => {
		const listener = vi.fn();
		const unsubscribe = subscribeNowPlaying(listener);

		setNowPlaying(rock);
		setNowPlaying({ ...rock });
		expect(listener).toHaveBeenCalledTimes(1);

		// Меняется только флаг — это тоже изменение
		setNowPlaying({ ...rock, audible: false });
		expect(listener).toHaveBeenCalledTimes(2);

		setNowPlaying(null);
		expect(listener).toHaveBeenCalledTimes(3);

		unsubscribe();
		setNowPlaying({ name: 'Jazz', countrycode: 'FR', playing: true, audible: true });
		expect(listener).toHaveBeenCalledTimes(3);
	});
});

describe('переключатель радио', () => {
	it('без обработчика ничего не делает', () => {
		expect(hasNowPlayingToggle()).toBe(false);
		expect(() => toggleNowPlaying()).not.toThrow();
	});

	it('вызывает зарегистрированный обработчик и сообщает подписчикам', () => {
		const handler = vi.fn();
		const listener = vi.fn();
		const unsubscribe = subscribeNowPlaying(listener);

		const unregister = registerNowPlayingToggle(handler);
		expect(hasNowPlayingToggle()).toBe(true);
		expect(listener).toHaveBeenCalledTimes(1);

		toggleNowPlaying();
		expect(handler).toHaveBeenCalledTimes(1);

		unregister();
		expect(hasNowPlayingToggle()).toBe(false);
		expect(listener).toHaveBeenCalledTimes(2);
		toggleNowPlaying();
		expect(handler).toHaveBeenCalledTimes(1);

		unsubscribe();
	});

	it('снятие старого обработчика не трогает новый', () => {
		const first = vi.fn();
		const second = vi.fn();
		const unregisterFirst = registerNowPlayingToggle(first);
		const unregisterSecond = registerNowPlayingToggle(second);

		unregisterFirst();
		expect(hasNowPlayingToggle()).toBe(true);
		toggleNowPlaying();
		expect(second).toHaveBeenCalledTimes(1);
		expect(first).not.toHaveBeenCalled();

		unregisterSecond();
		expect(hasNowPlayingToggle()).toBe(false);
	});
});
