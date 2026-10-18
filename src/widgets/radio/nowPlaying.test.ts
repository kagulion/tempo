import { afterEach, describe, expect, it, vi } from 'vitest';

import {
	getNowPlaying,
	hasNowPlayingToggle,
	nowPlayingName,
	registerNowPlayingToggle,
	setNowPlaying,
	subscribeNowPlaying,
	toggleNowPlaying,
	trackLabel
} from './nowPlaying';

const rock = { name: 'Rock', playing: true, audible: true };

afterEach(() => {
	setNowPlaying(null);
});

describe('nowPlayingName', () => {
	it('обрезает пробелы у названия', () => {
		expect(nowPlayingName({ name: '  Lo-Fi  ' })).toBe('Lo-Fi');
	});

	it('пустое название заменяет на «Без названия»', () => {
		expect(nowPlayingName({ name: '   ' })).toBe('Без названия');
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
		setNowPlaying({ name: 'Jazz', playing: true, audible: true });
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

describe('трек в nowPlaying', () => {
	const track = { artist: 'Artist', song: 'Song', cover: 'https://example.com/c.jpg' };

	it('смена трека — изменение, такой же трек — нет', () => {
		const listener = vi.fn();
		const unsubscribe = subscribeNowPlaying(listener);

		setNowPlaying({ ...rock, track });
		setNowPlaying({ ...rock, track: { ...track } });
		expect(listener).toHaveBeenCalledTimes(1);

		setNowPlaying({ ...rock, track: { ...track, song: 'Other' } });
		expect(listener).toHaveBeenCalledTimes(2);

		// Трек пропал
		setNowPlaying(rock);
		expect(listener).toHaveBeenCalledTimes(3);
		expect(getNowPlaying()?.track).toBeUndefined();
		unsubscribe();
	});

	it('trackLabel: «Исполнитель — Песня», без исполнителя только песня', () => {
		expect(trackLabel(track)).toBe('Artist — Song');
		expect(trackLabel({ artist: ' ', song: 'Song' })).toBe('Song');
	});
});
