// Временное скрытие эффектов поверх окон (искры, layer: 'front'). Их холст перекрывает весь экран, а встроенный
// плеер Twitch не играет, если его что-то перекрывает (см. docs/twitch.md). Пока такой плеер открыт, он просит убрать
// передние эффекты. Выбор эффектов и кнопка «Без эффектов» не меняются, не сохраняется. Просителей может быть несколько:
// эффекты возвращаются, когда отказался последний
import { useSyncExternalStore } from 'react';

const holders = new Set<string>();
const listeners = new Set<() => void>();
let suppressed = false;

export function setFrontEffectsSuppressed(holder: string, on: boolean) {
	if (on) holders.add(holder);
	else holders.delete(holder);
	const next = holders.size > 0;
	if (next === suppressed) return;
	suppressed = next;
	listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

export function useFrontEffectsSuppressed() {
	return useSyncExternalStore(subscribe, () => suppressed);
}
