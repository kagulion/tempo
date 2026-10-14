import { describe, expect, it } from 'vitest';

import { audioTarget, parseSoundOn, playerVolume, shouldPause } from './playback';

describe('shouldPause', () => {
	it('играет, пока ничего не мешает', () => {
		expect(shouldPause({ paused: false, hidden: false, reducedMotion: false })).toBe(false);
	});

	it('пауза от кнопки или скрытой вкладки', () => {
		expect(shouldPause({ paused: true, hidden: false, reducedMotion: false })).toBe(true);
		expect(shouldPause({ paused: false, hidden: true, reducedMotion: false })).toBe(true);
	});

	it('при «уменьшить движение» стоит, пока посетитель сам не запустит', () => {
		expect(shouldPause({ paused: undefined, hidden: false, reducedMotion: true })).toBe(true);
		expect(shouldPause({ paused: false, hidden: false, reducedMotion: true })).toBe(false);
		expect(shouldPause({ paused: false, hidden: true, reducedMotion: true })).toBe(true);
	});
});

describe('playerVolume', () => {
	it('переводит множитель в проценты плеера', () => {
		expect(playerVolume(1)).toBe(100);
		expect(playerVolume(0.456)).toBe(46);
		expect(playerVolume(0)).toBe(0);
	});

	it('не выходит за 0..100', () => {
		expect(playerVolume(2)).toBe(100);
		expect(playerVolume(-1)).toBe(0);
	});
});

describe('audioTarget', () => {
	const on = { soundOn: true, unlocked: true, active: true, duck: 1 };

	it('со звуком, когда всё разрешено', () => {
		expect(audioTarget(on)).toEqual({ muted: false, volume: 100 });
	});

	it('учитывает приглушение таймером', () => {
		expect(audioTarget({ ...on, duck: 0.5 })).toEqual({ muted: false, volume: 50 });
	});

	it('без звука, если он выключен', () => {
		expect(audioTarget({ ...on, soundOn: false })).toEqual({ muted: true });
	});

	it('без звука, пока браузер не разрешил', () => {
		expect(audioTarget({ ...on, unlocked: false })).toEqual({ muted: true });
	});

	it('без звука у слоя, который не главный', () => {
		expect(audioTarget({ ...on, active: false })).toEqual({ muted: true });
	});
});

describe('parseSoundOn', () => {
	it('принимает только boolean', () => {
		expect(parseSoundOn(true)).toBe(true);
		expect(parseSoundOn(false)).toBe(false);
		expect(parseSoundOn('true')).toBeUndefined();
		expect(parseSoundOn(1)).toBeUndefined();
		expect(parseSoundOn(null)).toBeUndefined();
	});
});
