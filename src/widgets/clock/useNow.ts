import { useEffect, useState } from 'react';

// Текущее время с компьютера. Обновляется в начале каждой минуты: секунды часы не показывают
export function useNow() {
	const [now, setNow] = useState(() => new Date());

	useEffect(() => {
		const delay = 60_000 - (now.getTime() % 60_000);
		const id = window.setTimeout(() => setNow(new Date()), delay);
		return () => window.clearTimeout(id);
	}, [now]);

	return now;
}
