import { useSyncExternalStore } from 'react';

// Фраза о смене фазы для скринридера (скрытый status в окне таймера). Хранится вне React-состояния:
// её ставит эффект конца фазы, а лишней перерисовки в эффекте мы не хотим
let message = '';
const listeners = new Set<() => void>();

export function setTimerMessage(text: string) {
	message = text;
	listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

export function useTimerMessage() {
	return useSyncExternalStore(subscribe, () => message);
}
