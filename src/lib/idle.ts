// Пауза после загрузки для тяжёлых запросов, не нужных первому экрану (список станций ~630 КБ, клиент Supabase):
// первый экран и главный текст успевают отрисоваться, а запрос не делит с ними канал
export const afterFirstScreenMs = 3000;

// Отложенный запуск некритичной работы: после загрузки страницы и в простое браузера, чтобы она не мешала первой отрисовке.
// Возвращает отмену. delay — сколько мс подождать после загрузки до простоя
export function whenIdle(task: () => void, delay = 0): () => void {
	let cancelled = false;
	let timer: ReturnType<typeof setTimeout> | undefined;
	let idle: number | undefined;

	function schedule() {
		timer = setTimeout(() => {
			if (cancelled) return;
			if (typeof requestIdleCallback === 'function') {
				idle = requestIdleCallback(() => !cancelled && task(), { timeout: 3000 });
			} else {
				task();
			}
		}, delay);
	}

	if (document.readyState === 'complete') schedule();
	else window.addEventListener('load', schedule, { once: true });

	return () => {
		cancelled = true;
		window.removeEventListener('load', schedule);
		clearTimeout(timer);
		if (idle !== undefined && typeof cancelIdleCallback === 'function') cancelIdleCallback(idle);
	};
}
