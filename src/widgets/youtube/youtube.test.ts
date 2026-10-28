import { describe, expect, it } from 'vitest';

import {
	addToHistory,
	parseHistory,
	parseYoutubeWallpaperId,
	removeFromHistory,
	setHistoryTitle,
	youtubeErrorMessage,
	youtubeWallpaperId
} from './youtube';

const id = 'dQw4w9WgXcQ';

describe('id обоев', () => {
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
