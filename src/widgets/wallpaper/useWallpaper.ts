import { useEffect, useMemo, useSyncExternalStore } from 'react';

import { createPersistentStore, isRecord, storageKeys } from '@/lib/storage';

import { parseRutubeWallpaperId } from '@/widgets/rutube/rutube';
import { parseYoutubeWallpaperId } from '@/widgets/youtube/youtube';
import { setPaused } from '@/widgets/youtube/youtubePlayback';
import { useYouTubeHistory } from '@/widgets/youtube/useYouTubeHistory';

import { parseCustomWallpaperId } from './custom';
import { loadCustomWallpapers, useCustomWallpapers } from './useCustomWallpapers';
import { type Wallpaper, rutubeWallpaper, wallpapers, youtubeWallpaper } from './wallpapers';

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
	// Эфиров Rutube в списке обоев тоже нет: достаточно, чтобы id был по форме rutube/<id эфира>.
	// Раньше были каналы ТВ (tv/<id канала>): такой id не годится и сбрасывается на обои по умолчанию
	if (parseRutubeWallpaperId(id) !== undefined) return { id: id as string };
	// Свои обои: по форме custom/<ключ>. Есть ли файл, проверяется после чтения IndexedDB (см. useWallpaper)
	if (parseCustomWallpaperId(id) !== undefined) return { id: id as string };
	// Список обоев мог поменяться: неизвестный id сбрасываем на обои по умолчанию
	return wallpapers.some((item) => item.id === id) ? { id: id as string } : undefined;
}

// Общее для фона и окон выбора. Хранилище недоступно (приватный режим) — после перезагрузки откроются обои по умолчанию
const store = createPersistentStore(storageKeys.wallpaper, { id: defaultWallpaperId }, parseSaved);

// Почему не удалось включить последнее видео или эфир. Не сохраняется: после перезагрузки ошибка уже не важна
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

// Выбирает обои по id. Отдельно от хука, чтобы первый экран со сценами мог выбрать обои, не подписываясь на остальное
export function selectWallpaper(next: string) {
	setLastError(undefined);
	// Новые обои начинают с чистого листа: видео не должно застыть из-за паузы на прошлом
	setPaused(undefined);
	store.set({ id: next });
}

// Выбранные обои, сохраняются в localStorage
export function useWallpaper() {
	const { id } = useSyncExternalStore(store.subscribe, store.get);
	const history = useYouTubeHistory();
	const error = useSyncExternalStore(subscribeError, () => lastError);
	const custom = useCustomWallpapers();

	// Выбраны свои обои: читаем их из IndexedDB, а если файла уже нет (данные сайта очистили) — тихо возвращаем обои по умолчанию
	const customSelected = parseCustomWallpaperId(id) !== undefined;
	const customMissing =
		customSelected && custom.loaded && !custom.items.some((item) => item.wallpaper.id === id);
	useEffect(() => {
		if (customSelected) void loadCustomWallpapers();
		if (customMissing) store.set({ id: defaultWallpaperId });
	}, [customSelected, customMissing]);

	const current = useMemo((): Wallpaper => {
		if (parseCustomWallpaperId(id) !== undefined) {
			const item = custom.items.find((entry) => entry.wallpaper.id === id);
			// Пока файл читается, показываем обои по умолчанию; выбор в localStorage не трогаем
			if (item) return item.wallpaper;
			return wallpapers.find((entry) => entry.id === defaultWallpaperId) ?? wallpapers[0];
		}
		const videoId = parseYoutubeWallpaperId(id);
		if (videoId !== undefined) {
			return youtubeWallpaper(history.find((item) => item.videoId === videoId) ?? { videoId });
		}
		const streamId = parseRutubeWallpaperId(id);
		if (streamId !== undefined) return rutubeWallpaper(streamId);
		return wallpapers.find((item) => item.id === id) ?? wallpapers[0];
	}, [id, history, custom.items]);

	return {
		current,
		select: selectWallpaper,
		// Выбранное не удалось показать: возвращаем прежние обои и запоминаем причину для окна
		fail: (message: string, fallbackId: string) => {
			store.set({ id: fallbackId });
			setLastError(message);
		},
		lastError: error,
		clearError: () => setLastError(undefined)
	};
}
