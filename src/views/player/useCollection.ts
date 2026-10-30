import { useSyncExternalStore } from 'react';

import { createPersistentStore, storageKeys } from '@/lib/storage';
import type { YouTubeVideo } from '@/lib/youtube/links';

import {
	addDisc,
	clearCategory,
	parseCollection,
	removeDisc,
	setDiscCategory,
	updateDisc,
	type Disc
} from './collection';

// Коллекция нужна и столу, и панели, и плееру (название, место), поэтому хранилище общее
const store = createPersistentStore<Disc[]>(storageKeys.playerCollection, [], parseCollection);

export function addToCollection(video: YouTubeVideo & { title?: string; categoryId?: string }) {
	store.set((list) => addDisc(list, video));
}

// Положить пластинку в категорию; без categoryId — убрать из категории
export function moveToCategory(id: string, categoryId: string | undefined) {
	const list = store.get();
	const next = setDiscCategory(list, id, categoryId);
	if (next !== list) store.set(next);
}

// Категорию удалили: её пластинки остаются, но без категории
export function clearCategoryInCollection(categoryId: string) {
	const list = store.get();
	const next = clearCategory(list, categoryId);
	if (next !== list) store.set(next);
}

export function removeFromCollection(id: string) {
	store.set((list) => removeDisc(list, id));
}

export function updateInCollection(id: string, patch: Parameters<typeof updateDisc>[2]) {
	const list = store.get();
	const next = updateDisc(list, id, patch);
	// Те же данные — не пишем в хранилище зря
	if (next !== list) store.set(next);
}

export function useCollection() {
	return useSyncExternalStore(store.subscribe, store.get);
}
