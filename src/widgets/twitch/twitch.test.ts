import { describe, expect, it } from 'vitest';

import { channelsFor, topicsWithChannels } from './channels';
import {
	initialStartTracker,
	normalizeLogin,
	parseTwitchUrl,
	parseSavedChannel,
	startTimeout,
	trackStart,
	twitchErrors,
	twitchPlayTimeoutMs,
	twitchReadyTimeoutMs,
	twitchThumbUrl
} from './twitch';

describe('normalizeLogin', () => {
	it('приводит к нижнему регистру и проверяет правила Twitch', () => {
		expect(normalizeLogin('LofiGirl')).toBe('lofigirl');
		expect(normalizeLogin('19barko')).toBe('19barko');
		expect(normalizeLogin('a_b_')).toBe('a_b_');
		expect(normalizeLogin('a'.repeat(25))).toBe('a'.repeat(25));
	});

	it('отбрасывает короткие, длинные и с лишними символами', () => {
		expect(normalizeLogin('abc')).toBeUndefined();
		expect(normalizeLogin('a'.repeat(26))).toBeUndefined();
		expect(normalizeLogin('lofi girl')).toBeUndefined();
		expect(normalizeLogin('лофи_гёрл')).toBeUndefined();
		expect(normalizeLogin('lofi-girl')).toBeUndefined();
		expect(normalizeLogin('')).toBeUndefined();
	});
});

describe('parseTwitchUrl', () => {
	it('читает ссылки на канал в разных видах', () => {
		expect(parseTwitchUrl('https://www.twitch.tv/lofigirl')).toBe('lofigirl');
		expect(parseTwitchUrl('https://twitch.tv/LofiGirl/')).toBe('lofigirl');
		expect(parseTwitchUrl('https://m.twitch.tv/lofigirl')).toBe('lofigirl');
		expect(parseTwitchUrl('twitch.tv/lofigirl')).toBe('lofigirl');
		expect(parseTwitchUrl('  http://www.twitch.tv/lofigirl?sr=a#top  ')).toBe('lofigirl');
	});

	it('читает ссылку плеера', () => {
		expect(parseTwitchUrl('https://player.twitch.tv/?channel=LofiGirl&parent=example.com')).toBe(
			'lofigirl'
		);
		expect(parseTwitchUrl('player.twitch.tv/?channel=chillhopradio')).toBe('chillhopradio');
		expect(parseTwitchUrl('https://player.twitch.tv/?video=123')).toBeUndefined();
		expect(parseTwitchUrl('https://player.twitch.tv/?channel=a')).toBeUndefined();
	});

	it('отбрасывает чужое и не каналы', () => {
		expect(parseTwitchUrl('https://example.com/lofigirl')).toBeUndefined();
		expect(parseTwitchUrl('https://nottwitch.tv/lofigirl')).toBeUndefined();
		expect(parseTwitchUrl('https://twitch.tv.evil.com/lofigirl')).toBeUndefined();
		expect(parseTwitchUrl('https://twitch.tv/')).toBeUndefined();
		expect(parseTwitchUrl('https://twitch.tv/directory')).toBeUndefined();
		expect(parseTwitchUrl('https://twitch.tv/videos/123456789')).toBeUndefined();
		expect(parseTwitchUrl('https://twitch.tv/lofigirl/videos')).toBeUndefined();
		expect(parseTwitchUrl('https://twitch.tv/abc')).toBeUndefined();
		expect(parseTwitchUrl('ftp://twitch.tv/lofigirl')).toBeUndefined();
		expect(parseTwitchUrl('lofigirl')).toBeUndefined();
		expect(parseTwitchUrl('')).toBeUndefined();
	});
});

describe('parseSavedChannel', () => {
	it('читает login и null', () => {
		expect(parseSavedChannel('lofigirl')).toBe('lofigirl');
		expect(parseSavedChannel('LofiGirl')).toBe('lofigirl');
		expect(parseSavedChannel(null)).toBeNull();
	});

	it('мусор отбрасывает', () => {
		expect(parseSavedChannel('abc')).toBeUndefined();
		expect(parseSavedChannel('lofi girl')).toBeUndefined();
		expect(parseSavedChannel(42)).toBeUndefined();
		expect(parseSavedChannel({ login: 'lofigirl' })).toBeUndefined();
		expect(parseSavedChannel(undefined)).toBeUndefined();
	});
});

describe('превью', () => {
	it('строит адрес без ключа API', () => {
		expect(twitchThumbUrl('lofigirl')).toBe(
			'https://static-cdn.jtvnw.net/previews-ttv/live_user_lofigirl-640x360.jpg'
		);
	});
});

describe('trackStart', () => {
	it('проходит READY → ONLINE → PLAYING', () => {
		let tracker = trackStart(initialStartTracker, 'ready');
		expect(tracker).toMatchObject({ ready: true, online: false, started: false });
		tracker = trackStart(tracker, 'online');
		expect(tracker).toMatchObject({ online: true, started: false });
		tracker = trackStart(tracker, 'playing');
		expect(tracker.started).toBe(true);
	});

	it('OFFLINE приходит сразу после READY', () => {
		const tracker = trackStart(trackStart(initialStartTracker, 'ready'), 'offline');
		expect(tracker).toMatchObject({ ready: true, offline: true, started: false });
	});

	it('после старта события не откатывают запуск (перезапуск потока после паузы)', () => {
		const started = trackStart(initialStartTracker, 'playing');
		expect(trackStart(started, 'ready')).toBe(started);
		expect(trackStart(started, 'offline')).toBe(started);
	});

	it('playbackBlocked запуск не меняет', () => {
		expect(trackStart(initialStartTracker, 'playbackBlocked')).toBe(initialStartTracker);
	});
});

describe('startTimeout', () => {
	it('без READY ждёт недолго и говорит про канал', () => {
		expect(startTimeout(initialStartTracker)).toEqual({
			ms: twitchReadyTimeoutMs,
			error: twitchErrors.noChannel
		});
	});

	it('после READY даёт запас на рекламу и говорит, что эфир не отвечает', () => {
		expect(startTimeout(trackStart(initialStartTracker, 'ready'))).toEqual({
			ms: twitchPlayTimeoutMs,
			error: twitchErrors.timeout
		});
		expect(twitchPlayTimeoutMs).toBeGreaterThan(twitchReadyTimeoutMs);
	});
});

describe('каналы темы «Музыка»', () => {
	it('шесть каналов по порядку, login правильные и не повторяются', () => {
		const channels = channelsFor('music');
		expect(channels.map((item) => item.login)).toEqual([
			'lofigirl',
			'chillhopradio',
			'leekbeats',
			'19barko',
			'lofitape',
			'relaxbeats'
		]);
		for (const item of channels) expect(normalizeLogin(item.login)).toBe(item.login);
		expect(topicsWithChannels.map((topic) => topic.label)).toEqual(['Музыка']);
	});
});
