import { useEffect, useState } from 'react';

// Часы и минуты в формате системы: 19:11 или 07:11 PM
const timeFormat = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });

// Текущее время с компьютера. Обновляется в начале каждой минуты. На телефоне скрыто: панель не влезает, а часы есть в статус-баре
export function DockClock() {
	const [now, setNow] = useState(() => new Date());

	useEffect(() => {
		const delay = 60_000 - (now.getTime() % 60_000);
		const id = window.setTimeout(() => setNow(new Date()), delay);
		return () => window.clearTimeout(id);
	}, [now]);

	return (
		<time
			dateTime={now.toISOString()}
			className="hidden h-9 items-center px-2 text-sm font-medium text-white/80 tabular-nums sm:flex"
		>
			{timeFormat.format(now)}
		</time>
	);
}
