import { useSyncExternalStore } from 'react';

import { createPersistentStore, storageKeys } from '@/lib/storage';
import { parseSoundOn } from '@/widgets/youtube/playback';
import { usePaused } from '@/widgets/youtube/youtubePlayback';

// Управление ТВ-фоном, общее для фона и окна ТВ. Пауза общая с видео YouTube (фон один), звук у ТВ свой

// Звук сохраняется. Громкость отдельно не настраивается: максимум с учётом приглушения таймером
const soundStore = createPersistentStore(storageKeys.tvSound, false, parseSoundOn);

export function useTvPlayback() {
	const paused = usePaused();
	const soundOn = useSyncExternalStore(soundStore.subscribe, soundStore.get);

	return {
		paused,
		soundOn,
		toggleSound: () => soundStore.set((value) => !value)
	};
}
