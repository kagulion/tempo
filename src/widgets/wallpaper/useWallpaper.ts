import { useSyncExternalStore } from 'react';

import { createPersistentStore, isRecord, storageKeys } from '@/lib/storage';

import { wallpapers } from './wallpapers';

// Обои при первом заходе — как раньше, первые обои Орды
const defaultId = 'horde/orcs-tavern';

// Раньше сохранялись фракция и номер обоев в ней: { faction, indexes }. Переводим в id, чтобы у старых посетителей фон не сбросился
const legacyOrder: Record<string, string[]> = {
	alliance: ['alliance/alliance-tavern', 'alliance/dwarfs-tavern', 'alliance/elfs-tavern'],
	horde: ['horde/orcs-tavern', 'horde/tauren-tavern', 'horde/bloody-elfs-tavern']
};

function parseSaved(saved: unknown): { id: string } | undefined {
	if (!isRecord(saved)) return undefined;
	let id = saved.id;
	if (id === undefined && typeof saved.faction === 'string') {
		const indexes = isRecord(saved.indexes) ? saved.indexes : {};
		const index = typeof indexes[saved.faction] === 'number' ? indexes[saved.faction] : 0;
		id = legacyOrder[saved.faction]?.[index as number];
	}
	// Список обоев мог поменяться: неизвестный id сбрасываем на обои по умолчанию
	return wallpapers.some((item) => item.id === id) ? { id: id as string } : undefined;
}

// Общее для фона и галереи. Хранилище недоступно (приватный режим) — после перезагрузки откроются обои по умолчанию
const store = createPersistentStore(storageKeys.wallpaper, { id: defaultId }, parseSaved);

// Выбранные обои, сохраняются в localStorage
export function useWallpaper() {
	const { id } = useSyncExternalStore(store.subscribe, store.get);

	return {
		current: wallpapers.find((item) => item.id === id) ?? wallpapers[0],
		select: (next: string) => store.set({ id: next })
	};
}
