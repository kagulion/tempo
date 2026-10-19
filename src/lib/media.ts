// Медиазапросы, которые сайт проверяет из кода. В React — через useMediaQuery из src/hooks/
export const mediaQueries = {
	// Узкий экран — меньше брейкпоинта xl из Tailwind (телефон, планшет, окно браузера при увеличенном масштабе):
	// три столбца окон не помещаются, окно на экране одно
	singleWindow: '(max-width: 1279px)',
	// Основной указатель — палец (нет мыши и клавиатуры): горячие клавиши не нужны
	coarsePointer: '(pointer: coarse)',
	// В системе включено «уменьшить движение»
	reducedMotion: '(prefers-reduced-motion: reduce)'
} as const;

// Разовая проверка вне React, например при запуске эффекта на canvas
export function matchesMedia(query: string) {
	return window.matchMedia(query).matches;
}
