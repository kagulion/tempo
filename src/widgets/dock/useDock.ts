import { useSyncExternalStore } from 'react';

import { usePersistentState } from '@/hooks/usePersistentState';
import { storageKeys } from '@/lib/storage';
import { isWidgetId, widgets, type WidgetId } from '@/widgets/registry';

// Окна, которые стоят на одном месте (одинаковый slot в реестре): открытие одного закрывает остальные
function slotmates(id: WidgetId): WidgetId[] {
	const slot = widgets.find((widget) => widget.id === id)?.slot;
	return slot ? widgets.filter((widget) => widget.slot === slot).map((widget) => widget.id) : [];
}

// Первый визит: всё как было до панели, звуки закрыты. На телефоне видно последнее — радио.
// Выключенные виджеты (enabled: false в реестре) отбрасываем
const defaultOpen = (['wallpaper', 'timer', 'radio'] satisfies WidgetId[]).filter(isWidgetId);

// Виджет могли убрать из реестра — неизвестные id отбрасываем
function parseOpen(saved: unknown): WidgetId[] | undefined {
	return Array.isArray(saved) ? saved.filter(isWidgetId) : undefined;
}

// Телефон — меньше брейкпоинта sm из Tailwind. Там помещается только одно окно
const mobileQuery = '(max-width: 639px)';

function subscribeMobile(listener: () => void) {
	const media = window.matchMedia(mobileQuery);
	media.addEventListener('change', listener);
	return () => media.removeEventListener('change', listener);
}

function isMobile() {
	return window.matchMedia(mobileQuery).matches;
}

// Какие окна виджетов открыты. Порядок — по времени открытия, последнее открытое в конце
export function useDock() {
	// Хранилище недоступно (приватный режим) — после перезагрузки откроем окна по умолчанию
	const [open, setOpen] = usePersistentState(storageKeys.openWidgets, defaultOpen, parseOpen);
	const mobile = useSyncExternalStore(subscribeMobile, isMobile);

	// На телефоне видно только последнее открытое окно, на компьютере — все открытые
	function isOpen(id: WidgetId) {
		return mobile ? open.at(-1) === id : open.includes(id);
	}

	function toggle(id: WidgetId) {
		if (isOpen(id)) setOpen((list) => list.filter((item) => item !== id));
		// На телефоне новое окно заменяет предыдущее, на компьютере — только соседа по месту
		else
			setOpen((list) =>
				mobile ? [id] : [...list.filter((item) => !slotmates(id).includes(item)), id]
			);
	}

	return { isOpen, toggle };
}
