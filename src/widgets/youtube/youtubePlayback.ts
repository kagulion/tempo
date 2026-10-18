import { useSyncExternalStore } from 'react';

import { createPersistentStore, storageKeys } from '@/lib/storage';

import { parseSoundOn } from './playback';
import { defaultVideoQuality, parseVideoQuality, type VideoQuality } from './quality';

// Управление видео-фоном с YouTube, общее для фона и окна YouTube. Пауза общая и для ТВ-фона: фон один

// Пауза от кнопки. undefined — посетитель не выбирал. Не сохраняется: после перезагрузки видео снова играет
let paused: boolean | undefined;
const pausedListeners = new Set<() => void>();

export function setPaused(next: boolean | undefined) {
	if (paused === next) return;
	paused = next;
	pausedListeners.forEach((listener) => listener());
}

function subscribePaused(listener: () => void) {
	pausedListeners.add(listener);
	return () => {
		pausedListeners.delete(listener);
	};
}

export function usePaused() {
	return useSyncExternalStore(subscribePaused, () => paused);
}

// Звук сохраняется. Громкость отдельно не настраивается: 100 с учётом приглушения таймером
const soundStore = createPersistentStore(storageKeys.youtubeSound, false, parseSoundOn);

// Потолок качества сохраняется: он нужен и окну (выбор), и фону (размер плеера), поэтому хранилище общее
const qualityStore = createPersistentStore<VideoQuality>(
	storageKeys.youtubeQuality,
	defaultVideoQuality,
	parseVideoQuality
);

export function useYouTubePlayback() {
	const pausedNow = usePaused();
	const soundOn = useSyncExternalStore(soundStore.subscribe, soundStore.get);
	const quality = useSyncExternalStore(qualityStore.subscribe, qualityStore.get);

	return {
		paused: pausedNow,
		soundOn,
		toggleSound: () => soundStore.set((value) => !value),
		quality,
		setQuality: (next: VideoQuality) => qualityStore.set(next)
	};
}
