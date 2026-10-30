import type { Disc } from './collection';

// Категории коллекции проигрывателя: названия, по которым пользователь раскладывает пластинки.
// Чистый модуль без React: его легко тестировать

export type Category = {
	id: string;
	name: string;
};

// Сколько категорий можно завести
export const categoryLimit = 20;
// Самое длинное название категории
export const categoryNameMax = 30;
// Самый длинный id, который примет parse (свои id короткие, длинный — признак мусора)
const idMax = 64;

// Тип данных перетаскивания плитки пластинки на вкладку категории (HTML5 drag and drop): в данных лежит id пластинки
export const discDragType = 'application/x-tempo-disc';

export type CategoryResult = { ok: true; list: Category[] } | { ok: false; error: string };

// Название без лишних пробелов или причина, по которой оно не подходит. Повтор ищем без учёта регистра;
// exceptId — категория, которую переименовываем: сама с собой она не считается повтором
export function checkCategoryName(
	list: Category[],
	name: string,
	exceptId?: string
): { ok: true; name: string } | { ok: false; error: string } {
	const trimmed = name.trim().replace(/\s+/g, ' ');
	if (trimmed === '') return { ok: false, error: 'Введите название категории' };
	if (trimmed.length > categoryNameMax) {
		return { ok: false, error: `Не длиннее ${categoryNameMax} символов` };
	}
	const key = trimmed.toLocaleLowerCase('ru');
	if (list.some((item) => item.id !== exceptId && item.name.toLocaleLowerCase('ru') === key)) {
		return { ok: false, error: 'Такая категория уже есть' };
	}
	return { ok: true, name: trimmed };
}

// Новая категория встаёт в конец. id приходит снаружи, чтобы функция оставалась чистой
export function addCategory(list: Category[], name: string, id: string): CategoryResult {
	if (list.length >= categoryLimit) {
		return { ok: false, error: `Можно создать не больше ${categoryLimit} категорий` };
	}
	const checked = checkCategoryName(list, name);
	if (!checked.ok) return checked;
	return { ok: true, list: [...list, { id, name: checked.name }] };
}

export function renameCategory(list: Category[], id: string, name: string): CategoryResult {
	if (!list.some((item) => item.id === id)) return { ok: true, list };
	const checked = checkCategoryName(list, name, id);
	if (!checked.ok) return checked;
	return {
		ok: true,
		// Название не изменилось — отдаём тот же список, чтобы не писать в хранилище зря
		list: list.some((item) => item.id === id && item.name === checked.name)
			? list
			: list.map((item) => (item.id === id ? { ...item, name: checked.name } : item))
	};
}

export function removeCategory(list: Category[], id: string) {
	return list.some((item) => item.id === id) ? list.filter((item) => item.id !== id) : list;
}

// Категория пластинки. Если id указывает на несуществующую категорию, пластинка считается без категории
export function discCategoryId(categories: Category[], disc: Disc): string | undefined {
	return disc.categoryId !== undefined && categories.some((item) => item.id === disc.categoryId)
		? disc.categoryId
		: undefined;
}

// Что показывать на вкладке. Без выбранной категории (вкладка «Все») — всё; если выбранной категории
// уже нет (например, удалили в другой вкладке браузера), тоже всё
export function filterDiscs(
	discs: Disc[],
	categories: Category[],
	selectedId: string | undefined
): Disc[] {
	if (selectedId === undefined || !categories.some((item) => item.id === selectedId)) return discs;
	return discs.filter((disc) => discCategoryId(categories, disc) === selectedId);
}

// Проверка сохранённых категорий: плохие элементы и повторы отбрасываем, остальные остаются
export function parseCategories(saved: unknown): Category[] | undefined {
	if (!Array.isArray(saved)) return undefined;

	const result: Category[] = [];
	for (const entry of saved) {
		if (typeof entry !== 'object' || entry === null) continue;
		const { id, name } = entry as Record<string, unknown>;
		if (typeof id !== 'string' || id === '' || id.length > idMax) continue;
		if (typeof name !== 'string') continue;
		const trimmed = name.trim().slice(0, categoryNameMax).trim();
		if (trimmed === '') continue;
		const key = trimmed.toLocaleLowerCase('ru');
		if (result.some((item) => item.id === id || item.name.toLocaleLowerCase('ru') === key))
			continue;
		result.push({ id, name: trimmed });
	}
	return result.slice(0, categoryLimit);
}
