import { useSyncExternalStore } from 'react';

import { createPersistentStore, storageKeys } from '@/lib/storage';

import {
	addCategory,
	parseCategories,
	removeCategory,
	renameCategory,
	type Category
} from './categories';
import { clearCategoryInCollection } from './useCollection';

// Категории нужны и вкладкам, и меню пластинки, поэтому хранилище общее
const store = createPersistentStore<Category[]>(storageKeys.playerCategories, [], parseCategories);

function newId() {
	return typeof crypto !== 'undefined' && 'randomUUID' in crypto
		? crypto.randomUUID()
		: `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

// Результат для формы: либо id новой (или переименованной) категории, либо текст ошибки
export type CategoryOutcome = { ok: true; id: string } | { ok: false; error: string };

export function createCategory(name: string): CategoryOutcome {
	const id = newId();
	const result = addCategory(store.get(), name, id);
	if (!result.ok) return result;
	store.set(result.list);
	return { ok: true, id };
}

export function renameCategoryById(id: string, name: string): CategoryOutcome {
	const list = store.get();
	const result = renameCategory(list, id, name);
	if (!result.ok) return result;
	if (result.list !== list) store.set(result.list);
	return { ok: true, id };
}

export function deleteCategory(id: string) {
	store.set((list) => removeCategory(list, id));
	clearCategoryInCollection(id);
}

export function useCategories() {
	return useSyncExternalStore(store.subscribe, store.get);
}
