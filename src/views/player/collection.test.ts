import { describe, expect, it } from 'vitest';

import {
	addDisc,
	discLimit,
	imageVariants,
	isPlaceholderSize,
	neighbourDisc,
	parseCollection,
	removeDisc,
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

	it('обрезает до лимита', () => {
		const many = Array.from({ length: 60 }, (_, i) => ({
			videoId: String(i).padStart(11, '0')
		}));
		expect(parseCollection(many)).toHaveLength(discLimit);
	});
});
