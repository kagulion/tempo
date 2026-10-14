import { useSyncExternalStore } from 'react';

import { createPersistentStore, storageKeys } from '@/lib/storage';

function parseShown(saved: unknown): boolean | undefined {
	return typeof saved === 'boolean' ? saved : undefined;
}

// Общее для часов на панели (переключают) и крупных часов на экране (показываются)
const store = createPersistentStore(storageKeys.bigClock, false, parseShown);

// Показаны ли крупные часы посередине экрана, сохраняется в localStorage
export function useBigClock() {
	const shown = useSyncExternalStore(store.subscribe, store.get);

	return { shown, toggle: () => store.set((current) => !current) };
}
