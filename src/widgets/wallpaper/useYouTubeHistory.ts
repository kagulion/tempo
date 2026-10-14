import { useSyncExternalStore } from 'react';

import { createPersistentStore, storageKeys } from '@/lib/storage';

import {
	addToHistory,
	parseHistory,
	removeFromHistory,
	setHistoryTitle,
	type YouTubeHistoryItem,
	type YouTubeVideo
} from './youtube';

// История ссылок нужна и галерее, и фону (название узнаёт плеер), поэтому хранилище общее
const store = createPersistentStore<YouTubeHistoryItem[]>(
	storageKeys.youtubeHistory,
	[],
	parseHistory
);

// Свежее видео сверху; повторная вставка того же видео поднимает его наверх
export function addYouTubeVideo(video: YouTubeVideo) {
	store.set((list) => addToHistory(list, video));
}

export function removeYouTubeVideo(videoId: string) {
	store.set((list) => removeFromHistory(list, videoId));
}

// Название приходит от плеера после старта. Видео, которого нет в истории, пропускаем
export function setYouTubeTitle(videoId: string, title: string) {
	const list = store.get();
	const next = setHistoryTitle(list, videoId, title);
	if (next !== list) store.set(next);
}

export function useYouTubeHistory() {
	return useSyncExternalStore(store.subscribe, store.get);
}
