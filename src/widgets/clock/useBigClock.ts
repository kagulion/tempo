import { useSyncExternalStore } from 'react';

import { createPersistentStore, storageKeys } from '@/lib/storage';

function parseShown(saved: unknown): boolean | undefined {
	return typeof saved === 'boolean' ? saved : undefined;
}

// Где стоят крупные часы: посередине экрана или свёрнутыми наверху по центру.
// Значение 'corner' осталось с тех пор, когда свёрнутые часы стояли в левом углу: так сохранённая настройка не теряется
export type BigClockPosition = 'center' | 'corner';

export function parsePosition(saved: unknown): BigClockPosition | undefined {
	return saved === 'center' || saved === 'corner' ? saved : undefined;
}

// Общее для часов на панели (переключают) и крупных часов на экране (показываются)
const store = createPersistentStore(storageKeys.bigClock, false, parseShown);
const positionStore = createPersistentStore<BigClockPosition>(
	storageKeys.bigClockPosition,
	'center',
	parsePosition
);

// Показаны ли крупные часы посередине экрана, сохраняется в localStorage
export function useBigClock() {
	const shown = useSyncExternalStore(store.subscribe, store.get);

	return { shown, toggle: () => store.set((current) => !current) };
}

// Позиция крупных часов (в центре или свёрнуты наверх), тоже сохраняется. На телефоне не действует
export function useBigClockPosition() {
	const position = useSyncExternalStore(positionStore.subscribe, positionStore.get);

	return {
		position,
		toggle: () => positionStore.set((current) => (current === 'center' ? 'corner' : 'center'))
	};
}
