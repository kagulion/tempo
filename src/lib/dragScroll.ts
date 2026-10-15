// Логика прокрутки рядов мышью без React: порог перетаскивания и выбор дельты колеса

// Мышь должна сдвинуться дальше этого порога (px), иначе это обычный клик
export const dragThreshold = 5;

export function exceedsDragThreshold(dx: number, dy = 0) {
	return Math.hypot(dx, dy) > dragThreshold;
}

type WheelMetrics = {
	deltaX: number;
	deltaY: number;
	scrollLeft: number;
	scrollWidth: number;
	clientWidth: number;
};

// На сколько прокрутить ряд по горизонтали колесом. 0 — колесо не трогаем (страница прокрутится сама):
// жест в основном горизонтальный или ряду некуда прокручиваться в эту сторону
export function wheelScrollDelta({
	deltaX,
	deltaY,
	scrollLeft,
	scrollWidth,
	clientWidth
}: WheelMetrics) {
	if (Math.abs(deltaY) <= Math.abs(deltaX)) return 0;
	const max = scrollWidth - clientWidth;
	if (max <= 0) return 0;
	if (deltaY > 0 && scrollLeft >= max) return 0;
	if (deltaY < 0 && scrollLeft <= 0) return 0;
	return deltaY;
}
