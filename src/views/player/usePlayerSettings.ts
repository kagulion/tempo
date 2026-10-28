import { useSyncExternalStore } from 'react';

import { createPersistentStore, storageKeys } from '@/lib/storage';

import { defaultSettings, parseSettings, type PlayerSettings } from './settings';

const store = createPersistentStore<PlayerSettings>(
	storageKeys.playerSettings,
	defaultSettings,
	parseSettings
);

export function updateSettings(patch: Partial<PlayerSettings>) {
	store.set((current) => ({ ...current, ...patch }));
}

export function usePlayerSettings() {
	return useSyncExternalStore(store.subscribe, store.get);
}
