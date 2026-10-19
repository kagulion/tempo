// Какие окна виджетов уже смонтированы. Окно монтируется при первом открытии (или сразу, если так сказано в реестре:
// mountAtStart) и после этого остаётся в странице, пока она жива: закрытое только прячется, радио и таймер продолжают работать.
// Хранится вне React, чтобы окно мог заказать и код вне App (например, сцены включают звуки, а играют они из окна звуков)
import { useSyncExternalStore } from 'react';

import { widgets, type WidgetId } from '@/widgets/registry';

let mounted: ReadonlySet<WidgetId> | null = null;
const listeners = new Set<() => void>();

// Начальный набор считаем при первом чтении, а не при импорте: mountAtStart читает localStorage
function getMounted(): ReadonlySet<WidgetId> {
	mounted ??= new Set(
		widgets.filter((widget) => widget.mountAtStart?.()).map((widget) => widget.id)
	);
	return mounted;
}

export function mountWidget(id: WidgetId) {
	const current = getMounted();
	if (current.has(id)) return;
	mounted = new Set([...current, id]);
	listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

export function useMountedWidgets() {
	return useSyncExternalStore(subscribe, getMounted);
}
