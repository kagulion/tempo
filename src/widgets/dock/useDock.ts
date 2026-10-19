import { useMediaQuery } from '@/hooks/useMediaQuery';
import { usePersistentState } from '@/hooks/usePersistentState';
import { mediaQueries } from '@/lib/media';
import { storageKeys } from '@/lib/storage';
import { isWidgetId, widgets, type WidgetId } from '@/widgets/registry';

// Окна, которые стоят на одном месте (одинаковый slot в реестре): открытие одного закрывает остальные
function slotmates(id: WidgetId): WidgetId[] {
	const slot = widgets.find((widget) => widget.id === id)?.slot;
	return slot ? widgets.filter((widget) => widget.slot === slot).map((widget) => widget.id) : [];
}

// Первый визит: всё как было до панели, звуки закрыты. На узком экране видно последнее — радио.
// Выключенные виджеты (enabled: false в реестре) отбрасываем
const defaultOpen = (['wallpaper', 'timer', 'radio'] satisfies WidgetId[]).filter(isWidgetId);

// Виджет могли убрать из реестра — неизвестные id отбрасываем. Окна могли попасть на одно место
// после правки slot в реестре (раньше таймер и статистика открывались вместе) — из соседей по месту оставляем последнее открытое
export function parseOpen(saved: unknown): WidgetId[] | undefined {
	if (!Array.isArray(saved)) return undefined;
	const known = saved.filter(isWidgetId);
	return known.filter((id, index) =>
		known.slice(index + 1).every((later) => !slotmates(id).includes(later))
	);
}

// Список открытых окон после открытия окна id: на узком экране оно заменяет все, на широком — только соседей по месту
export function openWindow(list: WidgetId[], id: WidgetId, single: boolean): WidgetId[] {
	return single ? [id] : [...list.filter((item) => !slotmates(id).includes(item)), id];
}

// Какие окна виджетов открыты. Порядок — по времени открытия, последнее открытое в конце
export function useDock() {
	// Хранилище недоступно (приватный режим) — после перезагрузки откроем окна по умолчанию
	const [open, setOpen] = usePersistentState(storageKeys.openWidgets, defaultOpen, parseOpen);
	// Меньше xl помещается только одно окно
	const single = useMediaQuery(mediaQueries.singleWindow);

	// На узком экране видно только последнее открытое окно, на широком — все открытые
	function isOpen(id: WidgetId) {
		return single ? open.at(-1) === id : open.includes(id);
	}

	function toggle(id: WidgetId) {
		if (isOpen(id)) setOpen((list) => list.filter((item) => item !== id));
		// На узком экране новое окно заменяет предыдущее, на широком — только соседа по месту
		else setOpen((list) => openWindow(list, id, single));
	}

	return { isOpen, toggle };
}
