import { useSyncExternalStore } from 'react';

import { createPersistentStore, storageKeys } from '@/lib/storage';
import { parseSoundOn } from '@/widgets/youtube/playback';
import { usePaused } from '@/widgets/youtube/youtubePlayback';

import { type LaunchEvent, type LaunchState, initialLaunch, reduceLaunch } from './launch';

// Управление Rutube-фоном, общее для фона и окна. Пауза общая с YouTube (фон один), звук у Rutube свой

// Звук сохраняется. Громкость отдельно не настраивается: максимум с учётом приглушения таймером
const soundStore = createPersistentStore(storageKeys.rutubeSound, false, parseSoundOn);

export function useRutubePlayback() {
	const paused = usePaused();
	const soundOn = useSyncExternalStore(soundStore.subscribe, soundStore.get);

	return {
		paused,
		soundOn,
		toggleSound: () => soundStore.set((value) => !value)
	};
}

// Запуск эфиров (см. launch.ts). Состояние общее для слоя и окна, по id эфира: слой уходящих обоев не должен
// сбросить запуск нового. Не сохраняется
const launches = new Map<string, LaunchState>();
const launchListeners = new Set<() => void>();

// Эфиры, которые посетитель выбрал сам в этом сеансе: только их плеер поднимается поверх окон
const userSelected = new Set<string>();

export function markUserSelected(streamId: string) {
	userSelected.add(streamId);
}

export function isUserSelected(streamId: string) {
	return userSelected.has(streamId);
}

export function launchEvent(streamId: string, event: LaunchEvent): LaunchState {
	const current = launches.get(streamId) ?? initialLaunch;
	const next = reduceLaunch(current, event);
	if (next !== current) {
		launches.set(streamId, next);
		launchListeners.forEach((listener) => listener());
	}
	return next;
}

export function clearLaunch(streamId: string) {
	if (launches.delete(streamId)) launchListeners.forEach((listener) => listener());
}

function subscribeLaunch(listener: () => void) {
	launchListeners.add(listener);
	return () => {
		launchListeners.delete(listener);
	};
}

export function useLaunchState(streamId: string | undefined): LaunchState {
	return useSyncExternalStore(subscribeLaunch, () =>
		streamId === undefined ? initialLaunch : (launches.get(streamId) ?? initialLaunch)
	);
}
