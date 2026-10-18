import { useState, useSyncExternalStore } from 'react';

import { createPersistentStore, storageKeys } from '@/lib/storage';

import { initialOnboarding, parseOnboarding, type OnboardingState } from './onboarding';
import { closeScenes, openScenes, useScenesReopened } from './scenesReopen';

// undefined до первого решения: флага в хранилище ещё нет
const store = createPersistentStore<OnboardingState | undefined>(
	storageKeys.onboarding,
	undefined,
	parseOnboarding
);

// Решаем один раз при первом обращении, пока другие виджеты не успели записать свои значения по умолчанию
function ensureResolved() {
	if (store.get() === undefined) {
		let keys: string[] = [];
		try {
			keys = Object.keys(localStorage);
		} catch {
			// Хранилище недоступно (приватный режим): считаем посетителя новым
		}
		store.set(initialOnboarding(keys, storageKeys.onboarding));
	}
}

// Первый экран со сценами: виден новому посетителю, пока он не выберет сцену или не пропустит.
// open() открывает его снова по просьбе посетителя, это не сохраняется (общий стор в scenesReopen.ts, кнопка в доке зовёт openScenes)
export function useOnboarding() {
	// Первая отрисовка App, до эффектов других виджетов
	useState(ensureResolved);
	const state = useSyncExternalStore(store.subscribe, store.get);
	const reopened = useScenesReopened();

	return {
		visible: state === 'pending' || reopened,
		open: openScenes,
		finish: () => {
			store.set('done');
			closeScenes();
		}
	};
}
