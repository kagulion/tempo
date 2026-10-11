// 1 день, 2 дня, 5 дней, 21 день
export function formatDays(count: number) {
	const mod10 = count % 10;
	const mod100 = count % 100;
	const word =
		mod10 === 1 && mod100 !== 11
			? 'день'
			: mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
				? 'дня'
				: 'дней';
	return `${count} ${word}`;
}

// 30 секунд → «< 1 мин», 45 минут → «45 мин», 150 минут → «2 ч 30 мин»
export function formatDuration(ms: number) {
	const minutes = Math.floor(ms / 60_000);
	if (minutes === 0) return '< 1 мин';
	const hours = Math.floor(minutes / 60);
	const rest = minutes % 60;
	if (hours === 0) return `${rest} мин`;
	return rest === 0 ? `${hours} ч` : `${hours} ч ${rest} мин`;
}
