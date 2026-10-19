// Переключатель «Клавиши сайта»: одиночные символьные клавиши можно отключить (WCAG 2.1.4 Character Key Shortcuts).
// Влияет на все привязки из списка клавиш, включая «?»; Esc и другие несимвольные клавиши обрабатываются отдельно и остаются
import { useSyncExternalStore } from 'react';

import { createPersistentStore, storageKeys } from './storage';

export function parseSiteHotkeys(saved: unknown): boolean | undefined {
	return typeof saved === 'boolean' ? saved : undefined;
}

// Включены ли клавиши сайта (по умолчанию да), сохраняется в localStorage
export const siteHotkeysStore = createPersistentStore(
	storageKeys.siteHotkeys,
	true,
	parseSiteHotkeys
);

export function useSiteHotkeys() {
	const enabled = useSyncExternalStore(siteHotkeysStore.subscribe, siteHotkeysStore.get);
	return { enabled, setEnabled: siteHotkeysStore.set };
}
