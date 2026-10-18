// Просьба открыть окно виджета из кода вне панели (например, из тоста). Состояние окон живёт в useDock в App.tsx
// и нигде больше недоступно, поэтому App подписывается на просьбы, а виджеты их отправляют
import type { WidgetId } from '@/widgets/registry';

type Listener = (id: WidgetId) => void;

const listeners = new Set<Listener>();

export function requestOpenWidget(id: WidgetId) {
	listeners.forEach((listener) => listener(id));
}

export function onOpenWidgetRequest(listener: Listener) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}
