import { describe, expect, it } from 'vitest';

import {
	addCategory,
	categoryLimit,
	categoryNameMax,
	checkCategoryName,
	discCategoryId,
	filterDiscs,
	parseCategories,
	removeCategory,
	renameCategory,
	type Category
} from './categories';
import type { Disc } from './collection';

const jazz: Category = { id: 'j', name: 'Джаз' };
const rock: Category = { id: 'r', name: 'Рок' };

function disc(id: string, categoryId?: string): Disc {
	return { id, videoId: id, image: 'cover', ...(categoryId ? { categoryId } : {}) };
}

describe('checkCategoryName', () => {
	it('обрезает пробелы по краям и схлопывает внутренние', () => {
		expect(checkCategoryName([], '  Лёгкий   джаз ')).toEqual({ ok: true, name: 'Лёгкий джаз' });
	});

	it('пустое название не подходит', () => {
		expect(checkCategoryName([], '   ')).toMatchObject({ ok: false });
	});

	it('слишком длинное не подходит, ровно в предел — подходит', () => {
		expect(checkCategoryName([], 'a'.repeat(categoryNameMax))).toMatchObject({ ok: true });
		expect(checkCategoryName([], 'a'.repeat(categoryNameMax + 1))).toMatchObject({ ok: false });
	});

	it('повтор ищет без учёта регистра, но себя не считает повтором', () => {
		expect(checkCategoryName([jazz], 'ДЖАЗ')).toMatchObject({ ok: false });
		expect(checkCategoryName([jazz], 'ДЖАЗ', 'j')).toEqual({ ok: true, name: 'ДЖАЗ' });
	});
});

describe('addCategory', () => {
	it('новая категория встаёт в конец', () => {
		const result = addCategory([jazz], ' Рок ', 'r');
		expect(result).toEqual({ ok: true, list: [jazz, rock] });
	});

	it('не добавляет повтор и пустое название', () => {
		expect(addCategory([jazz], 'джаз', 'x')).toMatchObject({ ok: false });
		expect(addCategory([jazz], '', 'x')).toMatchObject({ ok: false });
	});

	it('не больше лимита', () => {
		const full = Array.from({ length: categoryLimit }, (_, i) => ({ id: `c${i}`, name: `К${i}` }));
		expect(addCategory(full, 'Ещё одна', 'x')).toMatchObject({ ok: false });
	});
});

describe('renameCategory', () => {
	it('меняет название, id и порядок остаются', () => {
		expect(renameCategory([jazz, rock], 'j', 'Блюз')).toEqual({
			ok: true,
			list: [{ id: 'j', name: 'Блюз' }, rock]
		});
	});

	it('то же название (даже в другом регистре) принимается, без изменений отдаёт тот же список', () => {
		const list = [jazz, rock];
		const same = renameCategory(list, 'j', 'Джаз');
		expect(same.ok && same.list).toBe(list);
		expect(renameCategory(list, 'j', 'джаз')).toMatchObject({ ok: true });
	});

	it('занятое название и пустое не подходят', () => {
		expect(renameCategory([jazz, rock], 'j', 'рок')).toMatchObject({ ok: false });
		expect(renameCategory([jazz, rock], 'j', ' ')).toMatchObject({ ok: false });
	});

	it('нет такой категории — список не меняется', () => {
		const list = [jazz];
		const result = renameCategory(list, 'zzz', 'Блюз');
		expect(result.ok && result.list).toBe(list);
	});
});

describe('removeCategory', () => {
	it('убирает категорию по id', () => {
		expect(removeCategory([jazz, rock], 'j')).toEqual([rock]);
	});

	it('нет такой категории — тот же список', () => {
		const list = [jazz];
		expect(removeCategory(list, 'zzz')).toBe(list);
	});
});

describe('discCategoryId и filterDiscs', () => {
	const discs = [disc('a', 'j'), disc('b', 'r'), disc('c'), disc('d', 'gone')];

	it('несуществующая категория пластинки считается «без категории»', () => {
		expect(discCategoryId([jazz, rock], discs[0])).toBe('j');
		expect(discCategoryId([jazz, rock], discs[2])).toBeUndefined();
		expect(discCategoryId([jazz, rock], discs[3])).toBeUndefined();
	});

	it('«Все» показывает всё', () => {
		expect(filterDiscs(discs, [jazz, rock], undefined)).toBe(discs);
	});

	it('категория показывает только свои пластинки', () => {
		expect(filterDiscs(discs, [jazz, rock], 'r').map((d) => d.id)).toEqual(['b']);
	});

	it('выбранной категории уже нет — показывает всё', () => {
		expect(filterDiscs(discs, [jazz], 'r')).toBe(discs);
	});
});

describe('parseCategories', () => {
	it('не массив — undefined', () => {
		expect(parseCategories(null)).toBeUndefined();
		expect(parseCategories({ id: 'j', name: 'Джаз' })).toBeUndefined();
	});

	it('читает годные, плохие и повторные отбрасывает', () => {
		const result = parseCategories([
			jazz,
			{ id: 'j', name: 'Другое' },
			{ id: 'x', name: 'джаз' },
			{ id: '', name: 'Без id' },
			{ id: 'n', name: '   ' },
			{ id: 5, name: 'Число' },
			{ id: 'm' },
			null,
			'строка',
			rock
		]);
		expect(result).toEqual([jazz, rock]);
	});

	it('чинит название: обрезает пробелы и слишком длинное', () => {
		const result = parseCategories([{ id: 'l', name: `  ${'я'.repeat(categoryNameMax + 10)}  ` }]);
		expect(result).toEqual([{ id: 'l', name: 'я'.repeat(categoryNameMax) }]);
	});

	it('держит не больше лимита', () => {
		const many = Array.from({ length: categoryLimit + 5 }, (_, i) => ({
			id: `c${i}`,
			name: `К${i}`
		}));
		expect(parseCategories(many)).toHaveLength(categoryLimit);
	});
});
