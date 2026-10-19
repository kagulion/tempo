// Переключатель «Живые обои» в окне эффектов: видео-обои играют или стоят на кадре (WCAG 2.2.2).
// В хранилище лежит только явный выбор посетителя; пока его нет, решает «уменьшить движение» в системе
import { useSyncExternalStore } from 'react';

import { useMediaQuery } from '@/hooks/useMediaQuery';
import { mediaQueries } from '@/lib/media';
import { createPersistentStore, storageKeys } from '@/lib/storage';

export function parseLiveWallpaper(saved: unknown): boolean | null | undefined {
	return typeof saved === 'boolean' ? saved : undefined;
}

// Итог: явный выбор главнее системной настройки
export function resolveLive(saved: boolean | null, reducedMotion: boolean): boolean {
	return saved ?? !reducedMotion;
}

// null — посетитель ещё не выбирал
const store = createPersistentStore<boolean | null>(
	storageKeys.liveWallpaper,
	null,
	parseLiveWallpaper
);

export function useLiveWallpaper() {
	const saved = useSyncExternalStore(store.subscribe, store.get);
	const reducedMotion = useMediaQuery(mediaQueries.reducedMotion);
	const live = resolveLive(saved, reducedMotion);
	return { live, setLive: (next: boolean) => store.set(next) };
}
