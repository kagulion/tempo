import { describe, expect, it } from 'vitest';

import {
	addToHistory,
	parseHistory,
	parseTimestamp,
	parseYouTubeUrl,
	parseYoutubeWallpaperId,
	removeFromHistory,
	setHistoryTitle,
	youtubeErrorMessage,
	youtubeThumb,
	youtubeWallpaperId
} from './youtube';

const id = 'dQw4w9WgXcQ';

describe('parseYouTubeUrl', () => {
	it.each([
		`https://www.youtube.com/watch?v=${id}`,
		`https://youtube.com/watch?v=${id}&list=PL123&index=2`,
		`https://m.youtube.com/watch?v=${id}`,
		`https://music.youtube.com/watch?v=${id}`,
		`https://youtu.be/${id}`,
		`https://youtu.be/${id}?si=abc`,
		`https://www.youtube.com/shorts/${id}`,
		`https://www.youtube.com/live/${id}?feature=share`,
		`https://www.youtube.com/embed/${id}`,
		`https://www.youtube-nocookie.com/embed/${id}`,
		`http://youtube.com/watch?v=${id}`,
		`youtube.com/watch?v=${id}`,
		`www.youtube.com/watch?v=${id}`,
		`youtu.be/${id}`,
		`  https://youtu.be/${id}  `,
		`\n${id}\t`,
		id
	])('понимает %j', (input) => {
		expect(parseYouTubeUrl(input)).toEqual({ videoId: id });
	});

	it('понимает id с дефисом и подчёркиванием', () => {
		expect(parseYouTubeUrl('-_aB3-_xY9z')).toEqual({ videoId: '-_aB3-_xY9z' });
	});

	it('достаёт время старта', () => {
		expect(parseYouTubeUrl(`https://youtu.be/${id}?t=90`)).toEqual({ videoId: id, start: 90 });
		expect(parseYouTubeUrl(`https://youtu.be/${id}?t=1m30s`)).toEqual({ videoId: id, start: 90 });
		expect(parseYouTubeUrl(`https://www.youtube.com/watch?v=${id}&t=90s`)).toEqual({
			videoId: id,
			start: 90
		});
		expect(parseYouTubeUrl(`https://www.youtube.com/watch?v=${id}&start=12`)).toEqual({
			videoId: id,
			start: 12
		});
		expect(parseYouTubeUrl(`https://www.youtube.com/embed/${id}?start=5`)).toEqual({
			videoId: id,
			start: 5
		});
		expect(parseYouTubeUrl(`https://www.youtube.com/watch?v=${id}#t=45`)).toEqual({
			videoId: id,
			start: 45
		});
	});

	it('непонятное или нулевое время не мешает видео', () => {
		expect(parseYouTubeUrl(`https://youtu.be/${id}?t=abc`)).toEqual({ videoId: id });
		expect(parseYouTubeUrl(`https://youtu.be/${id}?t=0`)).toEqual({ videoId: id });
		expect(parseYouTubeUrl(`https://youtu.be/${id}?t=`)).toEqual({ videoId: id });
	});

	it.each([
		'',
		'   ',
		'привет',
		'https://example.com',
		`https://example.com/watch?v=${id}`,
		`https://youtube.com.evil.example/watch?v=${id}`,
		`https://notyoutube.com/watch?v=${id}`,
		'https://www.youtube.com/',
		'https://www.youtube.com/watch',
		'https://www.youtube.com/watch?v=short',
		`https://www.youtube.com/watch?v=${id}x`,
		'https://www.youtube.com/playlist?list=PL123',
		'https://www.youtube.com/@channel',
		`https://www.youtube-nocookie.com/watch?v=${id}`,
		`https://youtu.be/${id}x`,
		`ftp://youtu.be/${id}`,
		`javascript:alert('${id}')`,
		'dQw4w9WgXc',
		'dQw4w9WgXcQQ',
		'dQw4w9WgXc!'
	])('отбрасывает %j', (input) => {
		expect(parseYouTubeUrl(input)).toBeUndefined();
	});
});

describe('parseTimestamp', () => {
	it('переводит форматы в секунды', () => {
		expect(parseTimestamp('90')).toBe(90);
		expect(parseTimestamp('90s')).toBe(90);
		expect(parseTimestamp('1m30s')).toBe(90);
		expect(parseTimestamp('2m')).toBe(120);
		expect(parseTimestamp('1h2m3s')).toBe(3723);
		expect(parseTimestamp('1H')).toBe(3600);
	});

	it('мусор, ноль и пустое значение — undefined', () => {
		expect(parseTimestamp('')).toBeUndefined();
		expect(parseTimestamp(null)).toBeUndefined();
		expect(parseTimestamp('0')).toBeUndefined();
		expect(parseTimestamp('0s')).toBeUndefined();
		expect(parseTimestamp('-5')).toBeUndefined();
		expect(parseTimestamp('1.5')).toBeUndefined();
		expect(parseTimestamp('1x')).toBeUndefined();
		expect(parseTimestamp('30s1m')).toBeUndefined();
	});
});

describe('id обоев и превью', () => {
	it('собирает и разбирает id обоев', () => {
		expect(youtubeWallpaperId(id)).toBe(`youtube/${id}`);
		expect(parseYoutubeWallpaperId(`youtube/${id}`)).toBe(id);
	});

	it('чужие id не принимает', () => {
		expect(parseYoutubeWallpaperId('horde/orcs-tavern')).toBeUndefined();
		expect(parseYoutubeWallpaperId('youtube/short')).toBeUndefined();
		expect(parseYoutubeWallpaperId(`youtube/${id}/more`)).toBeUndefined();
		expect(parseYoutubeWallpaperId(`xyoutube/${id}`)).toBeUndefined();
		expect(parseYoutubeWallpaperId(undefined)).toBeUndefined();
	});

	it('даёт адрес превью', () => {
		expect(youtubeThumb(id)).toBe(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`);
	});
});

describe('youtubeErrorMessage', () => {
	it('объясняет коды ошибок плеера', () => {
		expect(youtubeErrorMessage(101)).toBe('Это видео нельзя встроить');
		expect(youtubeErrorMessage(150)).toBe('Это видео нельзя встроить');
		expect(youtubeErrorMessage(100)).toBe('Видео не найдено');
		expect(youtubeErrorMessage(2)).toBe('Видео не найдено');
		expect(youtubeErrorMessage(5)).toBe('Не удалось воспроизвести видео');
	});
});

describe('история', () => {
	const a = 'aaaaaaaaaaa';
	const b = 'bbbbbbbbbbb';
	const c = 'ccccccccccc';

	it('кладёт новое видео в начало', () => {
		expect(addToHistory([{ videoId: a }], { videoId: b })).toEqual([
			{ videoId: b },
			{ videoId: a }
		]);
	});

	it('не дублирует видео: повторное поднимается наверх, время берётся новое', () => {
		const list = [{ videoId: a, start: 10 }, { videoId: b }];
		expect(addToHistory(list, { videoId: b })).toEqual([{ videoId: b }, { videoId: a, start: 10 }]);
		expect(addToHistory(list, { videoId: a, start: 20 })).toEqual([
			{ videoId: a, start: 20 },
			{ videoId: b }
		]);
	});

	it('при повторной вставке сохраняет название', () => {
		const list = [{ videoId: a, title: 'Название' }];
		expect(addToHistory(list, { videoId: a })).toEqual([{ videoId: a, title: 'Название' }]);
		expect(addToHistory(list, { videoId: a, title: 'Новое' })).toEqual([
			{ videoId: a, title: 'Новое' }
		]);
	});

	it('обрезает список по максимуму', () => {
		const list = [{ videoId: a }, { videoId: b }];
		expect(addToHistory(list, { videoId: c }, 2)).toEqual([{ videoId: c }, { videoId: a }]);
		const long = Array.from({ length: 8 }, (_, i) => ({
			videoId: `video${String(i).padStart(6, '0')}`
		}));
		expect(addToHistory(long, { videoId: c })).toHaveLength(8);
	});

	it('не меняет исходный список', () => {
		const list = [{ videoId: a }];
		addToHistory(list, { videoId: b });
		removeFromHistory(list, a);
		expect(list).toEqual([{ videoId: a }]);
	});

	it('удаляет видео', () => {
		expect(removeFromHistory([{ videoId: a }, { videoId: b }], a)).toEqual([{ videoId: b }]);
		expect(removeFromHistory([{ videoId: a }], b)).toEqual([{ videoId: a }]);
	});

	it('обновляет название', () => {
		const list = [{ videoId: a }, { videoId: b, start: 5 }];
		expect(setHistoryTitle(list, b, 'Заголовок')).toEqual([
			{ videoId: a },
			{ videoId: b, start: 5, title: 'Заголовок' }
		]);
	});

	it('не трогает список, если менять нечего', () => {
		const list = [{ videoId: a, title: 'Так же' }];
		expect(setHistoryTitle(list, a, 'Так же')).toBe(list);
		expect(setHistoryTitle(list, b, 'Чужое')).toBe(list);
	});
});

describe('parseHistory', () => {
	it('читает сохранённый список', () => {
		expect(
			parseHistory([{ videoId: id, title: 'Клип', start: 30 }, { videoId: 'aaaaaaaaaaa' }])
		).toEqual([{ videoId: id, title: 'Клип', start: 30 }, { videoId: 'aaaaaaaaaaa' }]);
	});

	it('отбрасывает плохие элементы, остальные оставляет', () => {
		expect(
			parseHistory([
				null,
				'text',
				42,
				{ title: 'без id' },
				{ videoId: 'short' },
				{ videoId: 123 },
				{ videoId: id, title: '  ', start: -5 },
				{ videoId: id, start: 1.5 },
				{ videoId: 'aaaaaaaaaaa', title: 7, start: 'x' }
			])
		).toEqual([{ videoId: id }, { videoId: 'aaaaaaaaaaa' }]);
	});

	it('убирает дубли и держит лимит', () => {
		expect(parseHistory([{ videoId: id }, { videoId: id, title: 'Дубль' }])).toEqual([
			{ videoId: id }
		]);
		const many = Array.from({ length: 20 }, (_, i) => ({
			videoId: `video${String(i).padStart(6, '0')}`
		}));
		expect(parseHistory(many)).toHaveLength(8);
	});

	it('не массив — undefined', () => {
		expect(parseHistory({ videoId: id })).toBeUndefined();
		expect(parseHistory('text')).toBeUndefined();
		expect(parseHistory(null)).toBeUndefined();
	});
});
