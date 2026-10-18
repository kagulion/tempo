import { describe, expect, it } from 'vitest';

import {
	parsePlayerMessage,
	parseRutubeUrl,
	parseRutubeWallpaperId,
	initialStartTracker,
	isPlaybackSignal,
	parseStreams,
	playerCommand,
	rutubeTopics,
	rutubeWallpaperId,
	shouldAwaitClick,
	trackStart
} from './rutube';

const id = '546602986e6a424d74d594876ddb3f04';

describe('parseRutubeUrl', () => {
	it('читает ссылки на видео, эфир и плеер', () => {
		expect(parseRutubeUrl(`https://rutube.ru/video/${id}/`)).toBe(id);
		expect(parseRutubeUrl(`https://rutube.ru/live/video/${id}/`)).toBe(id);
		expect(parseRutubeUrl(`https://rutube.ru/play/embed/${id}`)).toBe(id);
	});

	it('принимает www, пробелы, http, query и ссылку без протокола', () => {
		expect(parseRutubeUrl(`  https://www.rutube.ru/video/${id}  `)).toBe(id);
		expect(parseRutubeUrl(`http://rutube.ru/video/${id}/?r=wd&t=30`)).toBe(id);
		expect(parseRutubeUrl(`rutube.ru/live/video/${id}`)).toBe(id);
		expect(parseRutubeUrl(`https://rutube.ru/video/${id}/#top`)).toBe(id);
	});

	it('приводит id к нижнему регистру', () => {
		expect(parseRutubeUrl(`https://rutube.ru/video/${id.toUpperCase()}/`)).toBe(id);
	});

	it('всё остальное даёт undefined', () => {
		expect(parseRutubeUrl('')).toBeUndefined();
		expect(parseRutubeUrl('привет')).toBeUndefined();
		expect(parseRutubeUrl(id)).toBeUndefined();
		expect(parseRutubeUrl(`https://youtube.com/video/${id}/`)).toBeUndefined();
		expect(parseRutubeUrl(`https://evilrutube.ru/video/${id}/`)).toBeUndefined();
		expect(parseRutubeUrl(`https://rutube.ru.evil.com/video/${id}/`)).toBeUndefined();
		expect(parseRutubeUrl(`ftp://rutube.ru/video/${id}/`)).toBeUndefined();
		expect(parseRutubeUrl('https://rutube.ru/video/short/')).toBeUndefined();
		expect(parseRutubeUrl(`https://rutube.ru/channel/${id}/`)).toBeUndefined();
		expect(parseRutubeUrl(`https://rutube.ru/video/${id}/extra/`)).toBeUndefined();
		expect(parseRutubeUrl('https://rutube.ru/')).toBeUndefined();
	});
});

describe('id обоев', () => {
	it('собирается и разбирается обратно', () => {
		expect(rutubeWallpaperId(id)).toBe(`rutube/${id}`);
		expect(parseRutubeWallpaperId(`rutube/${id}`)).toBe(id);
	});

	it('чужие id не принимает', () => {
		expect(parseRutubeWallpaperId(`tv/${id}`)).toBeUndefined();
		expect(parseRutubeWallpaperId('rutube/short')).toBeUndefined();
		expect(parseRutubeWallpaperId(`rutube/${id}/x`)).toBeUndefined();
		expect(parseRutubeWallpaperId(undefined)).toBeUndefined();
	});
});

describe('rutubeTopics', () => {
	it('пять тем в нужном порядке', () => {
		expect(rutubeTopics.map((topic) => topic.id)).toEqual([2, 5, 15, 8, 10]);
	});
});

describe('сообщения плеера', () => {
	it('разбирает JSON-строку и объект', () => {
		expect(parsePlayerMessage('{"type":"player:ready","data":{"a":1}}')).toEqual({
			type: 'player:ready',
			data: { a: 1 }
		});
		expect(parsePlayerMessage({ type: 'player:changeState' })).toEqual({
			type: 'player:changeState',
			data: {}
		});
	});

	it('чужое и испорченное отбрасывает', () => {
		expect(parsePlayerMessage('не json')).toBeUndefined();
		expect(parsePlayerMessage('{"type":"other"}')).toBeUndefined();
		expect(parsePlayerMessage(null)).toBeUndefined();
		expect(parsePlayerMessage(5)).toBeUndefined();
	});

	it('собирает команду', () => {
		expect(JSON.parse(playerCommand('player:setVolume', { volume: 0.5 }))).toEqual({
			type: 'player:setVolume',
			data: { volume: 0.5 }
		});
	});
});

describe('parseStreams', () => {
	it('оставляет годные эфиры и отбрасывает плохие', () => {
		const good = { id, title: 'Эфир', author: 'Автор', thumbnail: 'https://x/y.jpg', hits: 5 };
		expect(
			parseStreams({
				streams: [good, { ...good, id: 'bad' }, { ...good, title: ' ' }, null, 'x']
			})
		).toEqual([good]);
	});

	it('превью не по https убирает', () => {
		const [stream] = parseStreams({
			streams: [{ id, title: 'T', author: 1, thumbnail: 'http://x/y.jpg' }]
		});
		expect(stream).toEqual({ id, title: 'T', author: '', thumbnail: '', hits: 0 });
	});

	it('мусор даёт пустой список', () => {
		expect(parseStreams(null)).toEqual([]);
		expect(parseStreams({ streams: 1 })).toEqual([]);
	});
});

describe('trackStart', () => {
	const msg = (type: string, data: Record<string, unknown> = {}) => ({ type, data });
	const run = (messages: ReturnType<typeof msg>[]) =>
		messages.reduce(trackStart, initialStartTracker);
	const time = (t: number) => msg('player:currentTime', { time: t });

	it('эфир начался по changeState playing', () => {
		expect(run([msg('player:changeState', { state: 'playing' })]).started).toBe(true);
	});

	it('реклама, потом эфир', () => {
		const ad = [
			msg('player:changeState', { state: 'advert', phase: 'prepare' }),
			time(1),
			time(2),
			time(3)
		];
		expect(run(ad).started).toBe(false);
		expect(
			run([...ad, msg('player:changeState', { state: 'advert', phase: 'complete' })]).started
		).toBe(false);
		expect(run([...ad, msg('player:adEnd'), time(40), time(41), time(42)]).started).toBe(true);
		expect(run([...ad, msg('player:changeState', { state: 'playing' })]).started).toBe(true);
	});

	it('rollState и adStart тоже отмечают рекламу', () => {
		expect(
			run([msg('player:rollState', { state: 'play' }), time(1), time(2), time(3)]).started
		).toBe(false);
		expect(
			run([
				msg('player:rollState', { state: 'play' }),
				msg('player:rollState', { state: 'complete' }),
				time(1),
				time(2),
				time(3)
			]).started
		).toBe(true);
		expect(run([msg('player:adStart'), time(1), time(2), time(3)]).started).toBe(false);
	});

	it('эфир без рекламы: только currentTime', () => {
		expect(run([time(10)]).started).toBe(false);
		expect(run([time(10), time(11)]).started).toBe(false);
		expect(run([time(10), time(11), time(12)]).started).toBe(true);
		expect(run([msg('player:currentTime', { currentTime: 5 }), time(6), time(7)]).started).toBe(
			true
		);
	});

	it('пауза: время стоит — эфир не начался', () => {
		expect(
			run([time(10), time(10), time(10), msg('player:changeState', { state: 'paused' })]).started
		).toBe(false);
		expect(run([time(10), time(11), time(11), time(11)]).started).toBe(false);
	});

	it('playStart начинает эфир, но не во время рекламы', () => {
		expect(run([msg('player:playStart')]).started).toBe(true);
		expect(run([msg('player:adStart'), msg('player:playStart')]).started).toBe(false);
	});

	it('после старта состояние не меняется', () => {
		const started = run([msg('player:changeState', { state: 'playing' })]);
		expect(trackStart(started, msg('player:adStart'))).toBe(started);
	});
});

describe('ожидание клика', () => {
	const base = { ready: true, started: false, signalSeen: false, awaitedBefore: false };

	it('плеер готов, молчит и не начал — ждём клика', () => {
		expect(shouldAwaitClick(base)).toBe(true);
	});

	it('не ждём, если плеер не готов, эфир идёт или были сигналы', () => {
		expect(shouldAwaitClick({ ...base, ready: false })).toBe(false);
		expect(shouldAwaitClick({ ...base, started: true })).toBe(false);
		expect(shouldAwaitClick({ ...base, signalSeen: true })).toBe(false);
	});

	it('повторно в ожидание не переходим', () => {
		expect(shouldAwaitClick({ ...base, awaitedBefore: true })).toBe(false);
	});

	it('сигналы воспроизведения', () => {
		for (const type of [
			'player:changeState',
			'player:rollState',
			'player:playStart',
			'player:currentTime',
			'player:adStart'
		]) {
			expect(isPlaybackSignal(type)).toBe(true);
		}
		for (const type of [
			'player:ready',
			'player:init',
			'player:playOptionsLoaded',
			'player:activityConfig'
		]) {
			expect(isPlaybackSignal(type)).toBe(false);
		}
	});
});
