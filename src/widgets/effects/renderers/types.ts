// Несколько эффектов слоя рисуются на одном холсте. Цикл отрисовки, размер и плотность пикселей берёт на себя EffectCanvas
export type EffectRenderer = {
	// Первое заполнение частицами на весь экран, чтобы эффект не «натекал» сверху или снизу после включения
	init: (width: number, height: number) => void;
	// Кадр: сдвинуть частицы на dt секунд и нарисовать. Холст перед вызовом уже очищен, режим наложения и прозрачность сброшены (после вызова их восстанавливает EffectCanvas)
	draw: (
		ctx: CanvasRenderingContext2D,
		dt: number,
		now: number,
		width: number,
		height: number
	) => void;
};

// Сколько частиц на экране такого размера: плотность как у count на 1920×1080, но не меньше трети
export function scaledCount(count: number, width: number, height: number) {
	return Math.round(count * Math.max(1 / 3, (width * height) / (1920 * 1080)));
}
