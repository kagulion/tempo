import { afterEach, describe, expect, it, vi } from 'vitest';

import { getNowPlaying, nowPlayingLabel, setNowPlaying, subscribeNowPlaying } from './nowPlaying';

afterEach(() => {
	setNowPlaying(null);
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
		setNowPlaying({ name: 'Rock', countrycode: 'DE' });
		expect(getNowPlaying()).toEqual({ name: 'Rock', countrycode: 'DE' });
		setNowPlaying(null);
		expect(getNowPlaying()).toBeNull();
	});

	it('сообщает подписчикам об изменении и не шлёт одинаковое значение', () => {
		const listener = vi.fn();
		const unsubscribe = subscribeNowPlaying(listener);

		setNowPlaying({ name: 'Rock', countrycode: 'DE' });
		setNowPlaying({ name: 'Rock', countrycode: 'DE' });
		expect(listener).toHaveBeenCalledTimes(1);

		setNowPlaying(null);
		expect(listener).toHaveBeenCalledTimes(2);

		unsubscribe();
		setNowPlaying({ name: 'Jazz', countrycode: 'FR' });
		expect(listener).toHaveBeenCalledTimes(2);
	});
});
