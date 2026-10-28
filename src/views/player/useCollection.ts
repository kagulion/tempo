import { useSyncExternalStore } from 'react';

import { createPersistentStore, storageKeys } from '@/lib/storage';
import type { YouTubeVideo } from '@/lib/youtube/links';

import { addDisc, parseCollection, removeDisc, updateDisc, type Disc } from './collection';

// Коллекция нужна и столу, и панели, и плееру (название, место), поэтому хранилище общее
const store = createPersistentStore<Disc[]>(storageKeys.playerCollection, [], parseCollection);

export function addToCollection(video: YouTubeVideo & { title?: string }) {
	store.set((list) => addDisc(list, video));
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
