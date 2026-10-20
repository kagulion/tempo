// Кнопка «Без звука» в правом верхнем углу: одним нажатием глушит весь звук сайта.
// Ничего не выключает и не трогает громкость виджетов: радио, звуки, YouTube и Twitch продолжают «играть»,
// но их громкость умножается на 0 (через useDuckLevel), а сигнал таймера и тики нажатий молчат.
// Повторное нажатие возвращает всё как было
import { useSyncExternalStore } from 'react';

import { createPersistentStore, storageKeys } from './storage';

export function parseSoundMuted(saved: unknown): boolean | undefined {
	return typeof saved === 'boolean' ? saved : undefined;
}

// Включён ли режим «без звука» (по умолчанию нет), сохраняется в localStorage
export const soundMutedStore = createPersistentStore(
	storageKeys.soundMuted,
	false,
	parseSoundMuted
);

export function isSoundMuted() {
	return soundMutedStore.get();
}

export function toggleSoundMuted() {
	soundMutedStore.set((muted) => !muted);
}

export function useSoundMuted() {
	return useSyncExternalStore(soundMutedStore.subscribe, soundMutedStore.get);
}

// Итоговый множитель громкости: приглушение под таймер (0..1), а в режиме «без звука» — тишина
export function audibleLevel(duck: number, muted: boolean) {
	return muted ? 0 : duck;
}
