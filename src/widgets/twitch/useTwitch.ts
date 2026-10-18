import { useSyncExternalStore } from 'react';

import { createPersistentStore, storageKeys } from '@/lib/storage';
import { parseSoundOn } from '@/widgets/youtube/playback';

import { parseSavedChannel } from './twitch';

// Сохраняемое состояние окна Twitch, общее для окна и его шапки

// Последний выбранный канал: login или null. Эфир при открытии окна не запускается, только показывается превью
const channelStore = createPersistentStore<string | null>(
	storageKeys.twitchChannel,
	null,
	parseSavedChannel
);

export function setTwitchChannel(login: string) {
	channelStore.set(login);
}

export function useTwitchChannel() {
	return useSyncExternalStore(channelStore.subscribe, channelStore.get);
}

// Звук сохраняется. Громкость отдельно не настраивается: максимум с учётом приглушения таймером
const soundStore = createPersistentStore(storageKeys.twitchSound, false, parseSoundOn);

export function useTwitchSound() {
	const soundOn = useSyncExternalStore(soundStore.subscribe, soundStore.get);
	return { soundOn, toggleSound: () => soundStore.set((value) => !value) };
}
