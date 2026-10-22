// Свечение, один раз нарисованное в маленький холст: в кадре его рисует drawImage вместо
// радиального градиента на каждую частицу. Холст создаётся при первом обращении, не при импорте
// модуля (тесты идут в Node без document)
export function createGlowSprite(
	size: number,
	paint: (ctx: CanvasRenderingContext2D, size: number) => void
) {
	let sprite: HTMLCanvasElement | undefined;
	return () => {
		if (!sprite) {
			sprite = document.createElement('canvas');
			sprite.width = size;
			sprite.height = size;
			const ctx = sprite.getContext('2d');
			if (ctx) paint(ctx, size);
		}
		return sprite;
	};
}
