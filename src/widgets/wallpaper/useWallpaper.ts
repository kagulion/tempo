import { useMemo, useSyncExternalStore } from 'react';

import { createPersistentStore, isRecord, storageKeys } from '@/lib/storage';

import { useYouTubeHistory } from './useYouTubeHistory';
import { type Wallpaper, wallpapers, youtubeWallpaper } from './wallpapers';
import { parseYoutubeWallpaperId } from './youtube';
import { setPaused } from './youtubePlayback';

// Обои при первом заходе — как раньше, первые обои Орды
export const defaultWallpaperId = 'horde/orcs-tavern';

// Раньше сохранялись фракция и номер обоев в ней: { faction, indexes }. Переводим в id, чтобы у старых посетителей фон не сбросился
const legacyOrder: Record<string, string[]> = {
	alliance: ['alliance/alliance-tavern', 'alliance/dwarfs-tavern', 'alliance/elfs-tavern'],
	horde: ['horde/orcs-tavern', 'horde/tauren-tavern', 'horde/bloody-elfs-tavern']
};

export function parseSaved(saved: unknown): { id: string } | undefined {
	if (!isRecord(saved)) return undefined;
	let id = saved.id;
	if (id === undefined && typeof saved.faction === 'string') {
		const indexes = isRecord(saved.indexes) ? saved.indexes : {};
		const index = typeof indexes[saved.faction] === 'number' ? indexes[saved.faction] : 0;
		id = legacyOrder[saved.faction]?.[index as number];
	}
	// Видео с YouTube в списке обоев нет: достаточно, чтобы id был по форме youtube/<id видео>
	if (parseYoutubeWallpaperId(id) !== undefined) return { id: id as string };
	// Список обоев мог поменяться: неизвестный id сбрасываем на обои по умолчанию
	return wallpapers.some((item) => item.id === id) ? { id: id as string } : undefined;
}

// Общее для фона и галереи. Хранилище недоступно (приватный режим) — после перезагрузки откроются обои по умолчанию
const store = createPersistentStore(storageKeys.wallpaper, { id: defaultWallpaperId }, parseSaved);

// Почему не удалось включить последнее видео. Не сохраняется: после перезагрузки ошибка уже не важна
let lastError: string | undefined;
const errorListeners = new Set<() => void>();

function setLastError(message: string | undefined) {
	if (lastError === message) return;
	lastError = message;
	errorListeners.forEach((listener) => listener());
}

function subscribeError(listener: () => void) {
	errorListeners.add(listener);
	return () => {
		errorListeners.delete(listener);
	};
}

// Выбранные обои, сохраняются в localStorage
export function useWallpaper() {
	const { id } = useSyncExternalStore(store.subscribe, store.get);
	const history = useYouTubeHistory();
	const error = useSyncExternalStore(subscribeError, () => lastError);

	const current = useMemo((): Wallpaper => {
		const videoId = parseYoutubeWallpaperId(id);
		if (videoId !== undefined) {
			return youtubeWallpaper(history.find((item) => item.videoId === videoId) ?? { videoId });
		}
		return wallpapers.find((item) => item.id === id) ?? wallpapers[0];
	}, [id, history]);

	return {
		current,
		select: (next: string) => {
			setLastError(undefined);
			// Новые обои начинают с чистого листа: видео не должно застыть из-за паузы на прошлом
			setPaused(undefined);
			store.set({ id: next });
		},
		// Выбранное не удалось показать: возвращаем прежние обои и запоминаем причину для галереи
		fail: (message: string, fallbackId: string) => {
			store.set({ id: fallbackId });
			setLastError(message);
		},
		lastError: error,
		clearError: () => setLastError(undefined)
	};
}
