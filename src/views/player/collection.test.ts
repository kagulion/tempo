import { describe, expect, it } from 'vitest';

import {
	addDisc,
	clearCategory,
	discLimit,
	imageVariants,
	isPlaceholderSize,
	neighbourDisc,
	parseCollection,
	removeDisc,
	setDiscCategory,
	updateDisc,
	type Disc
} from './collection';

const a = 'aaaaaaaaaaa';
const b = 'bbbbbbbbbbb';
const c = 'ccccccccccc';

function disc(videoId: string, extra: Partial<Disc> = {}): Disc {
	return { id: videoId, videoId, image: 'cover', ...extra };
}

describe('addDisc', () => {
	it('новая пластинка встаёт наверх с настройками по умолчанию', () => {
		const list = addDisc([disc(a)], { videoId: b, start: 30 });
		expect(list.map((d) => d.id)).toEqual([b, a]);
		expect(list[0]).toEqual({ id: b, videoId: b, image: 'cover', start: 30 });
	});

	it('повторное добавление поднимает пластинку и сохраняет настройки и место', () => {
		const list = addDisc([disc(a), disc(b, { image: 'frame2', position: 99 })], {
			videoId: b
		});
		expect(list.map((d) => d.id)).toEqual([b, a]);
		expect(list[0]).toMatchObject({ image: 'frame2', position: 99 });
	});

	it('название: новое заменяет старое, без нового остаётся старое', () => {
		const start = [disc(a, { title: 'Старое' })];
		expect(addDisc(start, { videoId: a })[0].title).toBe('Старое');
		expect(addDisc(start, { videoId: a, title: 'Новое' })[0].title).toBe('Новое');
	});

	it('держит не больше лимита, лишние уходят с конца', () => {
		const list = addDisc([disc(a), disc(b)], { videoId: c }, 2);
		expect(list.map((d) => d.id)).toEqual([c, a]);
		expect(discLimit).toBe(50);
	});
});

describe('категории пластинок', () => {
	it('новая пластинка сразу попадает в категорию открытой вкладки', () => {
		const list = addDisc([disc(a)], { videoId: b, categoryId: 'jazz' });
		expect(list[0]).toEqual({ id: b, videoId: b, image: 'cover', categoryId: 'jazz' });
	});

	it('повторное добавление без категории (вкладка «Все») не меняет категорию', () => {
		const list = addDisc([disc(a, { categoryId: 'jazz' })], { videoId: a });
		expect(list[0].categoryId).toBe('jazz');
	});

	it('повторное добавление на вкладке категории переносит пластинку в неё', () => {
		const list = addDisc([disc(a, { categoryId: 'jazz' })], { videoId: a, categoryId: 'rock' });
		expect(list[0].categoryId).toBe('rock');
	});

	it('setDiscCategory кладёт в категорию и убирает из неё', () => {
		const list = [disc(a), disc(b)];
		const moved = setDiscCategory(list, b, 'jazz');
		expect(moved[1].categoryId).toBe('jazz');
		expect(moved[0]).toBe(list[0]);
		const cleared = setDiscCategory(moved, b, undefined);
		expect(cleared[1]).toEqual(disc(b));
		expect('categoryId' in cleared[1]).toBe(false);
	});

	it('setDiscCategory без изменений или без пластинки отдаёт тот же список', () => {
		const list = [disc(a, { categoryId: 'jazz' }), disc(b)];
		expect(setDiscCategory(list, a, 'jazz')).toBe(list);
		expect(setDiscCategory(list, b, undefined)).toBe(list);
		expect(setDiscCategory(list, c, 'jazz')).toBe(list);
	});

	it('clearCategory оставляет пластинки, но убирает у них категорию', () => {
		const list = [disc(a, { categoryId: 'jazz' }), disc(b, { categoryId: 'rock' }), disc(c)];
		const next = clearCategory(list, 'jazz');
		expect(next.map((d) => d.id)).toEqual([a, b, c]);
		expect(next[0]).toEqual(disc(a));
		expect(next[1].categoryId).toBe('rock');
		expect(clearCategory(next, 'jazz')).toBe(next);
	});
});

describe('removeDisc и updateDisc', () => {
	it('удаляет по id', () => {
		expect(removeDisc([disc(a), disc(b)], a).map((d) => d.id)).toEqual([b]);
	});

	it('меняет поля', () => {
		const list = [disc(a), disc(b)];
		expect(updateDisc(list, b, { image: 'frame1' })[1].image).toBe('frame1');
	});

	it('без изменений или без пластинки отдаёт тот же список', () => {
		const list = [disc(a)];
		expect(updateDisc(list, a, { image: 'cover' })).toBe(list);
		expect(updateDisc(list, b, { image: 'frame1' })).toBe(list);
		// Место 0 — то же, что нет места
		expect(updateDisc(list, a, { position: 0 })).toBe(list);
		expect(updateDisc(list, a, { position: 30 })).not.toBe(list);
	});
});

describe('neighbourDisc', () => {
	const list = [disc(a), disc(b), disc(c)];

	it('идёт вперёд и назад', () => {
		expect(neighbourDisc(list, b, 1)?.id).toBe(c);
		expect(neighbourDisc(list, b, -1)?.id).toBe(a);
	});

	it('на краях переходит по кругу', () => {
		expect(neighbourDisc(list, c, 1)?.id).toBe(a);
		expect(neighbourDisc(list, a, -1)?.id).toBe(c);
	});

	it('без круга за краем ничего нет', () => {
		expect(neighbourDisc(list, c, 1, false)).toBeUndefined();
		expect(neighbourDisc(list, a, -1, false)).toBeUndefined();
	});

	it('неизвестная текущая начинает с края, пустой список — undefined', () => {
		expect(neighbourDisc(list, undefined, 1)?.id).toBe(a);
		expect(neighbourDisc(list, undefined, -1)?.id).toBe(c);
		expect(neighbourDisc([], a, 1)).toBeUndefined();
	});

	it('одна пластинка по кругу возвращается на себя', () => {
		expect(neighbourDisc([disc(a)], a, 1)?.id).toBe(a);
	});
});

describe('imageVariants и заглушка', () => {
	it('обложка: maxres, затем hq', () => {
		expect(imageVariants('cover')).toEqual(['maxresdefault', 'hqdefault']);
	});

	it('заглушка 120x90 у всего, кроме мелких кадров и hqdefault', () => {
		expect(isPlaceholderSize('maxresdefault', 120)).toBe(true);
		expect(isPlaceholderSize('maxresdefault', 1280)).toBe(false);
		expect(isPlaceholderSize('1', 120)).toBe(false);
		expect(isPlaceholderSize('hqdefault', 120)).toBe(false);
		expect(isPlaceholderSize('hq2', 120)).toBe(true);
		expect(isPlaceholderSize('hq1', 480)).toBe(false);
	});
});

describe('parseCollection', () => {
	it('не массив — undefined', () => {
		expect(parseCollection(null)).toBeUndefined();
		expect(parseCollection({})).toBeUndefined();
	});

	it('отбрасывает плохие и повторные элементы, чинит поля', () => {
		const result = parseCollection([
			{ videoId: a, title: 'Микс', image: 'frame3', start: 10, position: 12.5 },
			{ videoId: a },
			{ videoId: 'short' },
			null,
			'строка',
			{ videoId: b, image: 5, title: '  ', start: -1, position: -3 }
		]);
		expect(result).toEqual([
			{
				id: a,
				videoId: a,
				title: 'Микс',
				image: 'frame3',
				start: 10,
				position: 12.5
			},
			{ id: b, videoId: b, image: 'cover' }
		]);
	});

	it('читает categoryId, старые данные без него читаются как раньше, мусор в нём отбрасывается', () => {
		const result = parseCollection([
			{ videoId: a, categoryId: 'jazz' },
			{ videoId: b },
			{ videoId: c, categoryId: 5 }
		]);
		expect(result?.[0].categoryId).toBe('jazz');
		expect(result?.[1]).toEqual({ id: b, videoId: b, image: 'cover' });
		expect(result?.[2]).toEqual({ id: c, videoId: c, image: 'cover' });
	});

	it('обрезает до лимита', () => {
		const many = Array.from({ length: 60 }, (_, i) => ({
			videoId: String(i).padStart(11, '0')
		}));
		expect(parseCollection(many)).toHaveLength(discLimit);
	});
});
