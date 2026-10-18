import { useSyncExternalStore } from 'react';

// Открыт ли экран со сценами по просьбе посетителя (кнопка в доке, клавиша S). Не сохраняется:
// после перезагрузки экран снова решает useOnboarding по флагу в хранилище
let reopened = false;
const listeners = new Set<() => void>();

function setReopened(value: boolean) {
	if (reopened === value) return;
	reopened = value;
	for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

// Открыть экран со сценами снова. Можно вызывать откуда угодно
export function openScenes() {
	setReopened(true);
}

export function closeScenes() {
	setReopened(false);
}

export function useScenesReopened() {
	return useSyncExternalStore(subscribe, () => reopened);
}
