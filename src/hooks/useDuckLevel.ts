import { useEffect, useState } from 'react';

import { duckLevel, isDucking, subscribeDucking } from '@/lib/ducking';

// Текущий множитель громкости из src/lib/ducking.ts. Пока таймер ничего не ждёт, не тикает
export function useDuckLevel() {
	const [level, setLevel] = useState(() => duckLevel(Date.now()));

	useEffect(() => {
		let timer: ReturnType<typeof setInterval> | undefined;

		function update() {
			const now = Date.now();
			// Округляем, чтобы не перерисовываться из-за тысячных долей
			setLevel(Math.round(duckLevel(now) * 100) / 100);
			if (isDucking(now)) {
				timer ??= setInterval(update, 100);
			} else if (timer) {
				clearInterval(timer);
				timer = undefined;
			}
		}

		update();
		const unsubscribe = subscribeDucking(update);
		return () => {
			unsubscribe();
			clearInterval(timer);
		};
	}, []);

	return level;
}
