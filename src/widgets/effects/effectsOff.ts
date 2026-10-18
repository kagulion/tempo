// Кнопка «Без эффектов» в правом верхнем углу: одним нажатием убирает всё, что рисуется поверх обоев, —
// частицы (EffectLayers) и затемнение (DimmerLayer). Обои, видео YouTube и ТВ-фон остаются: это сам фон.
// Выбор эффектов и уровень затемнения не меняются, поэтому повторное нажатие возвращает всё как было
import { useSyncExternalStore } from 'react';

import { createPersistentStore, storageKeys } from '@/lib/storage';

export function parseEffectsOff(saved: unknown): boolean | undefined {
	return typeof saved === 'boolean' ? saved : undefined;
}

// Скрыты ли эффекты (по умолчанию нет), сохраняется в localStorage
export const effectsOffStore = createPersistentStore(
	storageKeys.effectsOff,
	false,
	parseEffectsOff
);

export function toggleEffectsOff() {
	effectsOffStore.set((off) => !off);
}

export function useEffectsOff() {
	return useSyncExternalStore(effectsOffStore.subscribe, effectsOffStore.get);
}
