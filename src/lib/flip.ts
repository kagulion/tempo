import { matchesMedia, mediaQueries } from '@/lib/media';

// FLIP-анимации: элемент уже стоит на новом месте, а transform возвращает его на старое
// и плавно снимается. Здесь общие кривые и расчёт transform

// Прямоугольник элемента: подходит и DOMRect, и обычный объект в тестах
export type DOMRectLike = {
	left: number;
	top: number;
	width: number;
	height: number;
};

// Появление и реакция на действие: быстрый старт, мягкое окончание
export const easeOutStrong = 'cubic-bezier(0.23, 1, 0.32, 1)';
// Перемещение по экрану: элемент разгоняется и тормозит
export const easeInOutStrong = 'cubic-bezier(0.77, 0, 0.175, 1)';

// transform (для transform-origin: top left), который ставит элемент «to» на место «from».
// При нулевом размере масштаб не считается — остаётся 1
export function flipTransform(from: DOMRectLike, to: DOMRectLike): string {
	const dx = from.left - to.left;
	const dy = from.top - to.top;
	const sx = to.width > 0 ? from.width / to.width : 1;
	const sy = to.height > 0 ? from.height / to.height : 1;
	return `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
}

// В системе включено «уменьшить движение»: вместо перемещения оставляем только мягкое проявление
export function prefersReducedMotion() {
	return matchesMedia(mediaQueries.reducedMotion);
}
