// Медиазапросы, которые сайт проверяет из кода. В React — через useMediaQuery из src/hooks/
export const mediaQueries = {
	// Телефон — меньше брейкпоинта sm из Tailwind
	mobile: '(max-width: 639px)',
	// В системе включено «уменьшить движение»
	reducedMotion: '(prefers-reduced-motion: reduce)'
} as const;

// Разовая проверка вне React, например при запуске эффекта на canvas
export function matchesMedia(query: string) {
	return window.matchMedia(query).matches;
}
