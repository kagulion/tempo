import { useSyncExternalStore } from 'react';

import { createPersistentStore, storageKeys } from '@/lib/storage';

import { dimmerDefault, parseDimmer } from './dimmer';

// Общее состояние: значение нужно и окну с ползунком, и слою над обоями
const store = createPersistentStore(storageKeys.dimmer, dimmerDefault, parseDimmer);

export function useDimmer() {
	const value = useSyncExternalStore(store.subscribe, store.get);
	return { value, setValue: (next: number) => store.set(next) };
}
