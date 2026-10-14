// Подсчёт серии дней и времени на сайте без React и без хранилища. Хук — в useVisitStats.ts.
// Тесты — в visits.test.ts

export type VisitStats = {
	// Последний день с заходом на сайт, по местному времени: 2026-10-11
	lastDay: string;
	// Сколько дней подряд, включая lastDay, пользователь заходил на сайт
	streak: number;
	best: number;
	todayMs: number;
	totalMs: number;
	// Когда время на сайте учли в последний раз. Общая метка для всех вкладок, чтобы не считать время дважды
	lastTick: number;
};

// Фоновые вкладки браузер будит примерно раз в минуту. Разрыв длиннее — сайт был закрыт или компьютер спал
export const maxGapMs = 65_000;

export function dayKey(time: number) {
	const date = new Date(time);
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${date.getFullYear()}-${month}-${day}`;
}

// Разница в календарных днях между двумя ключами dayKey
export function daysBetween(from: string, to: string) {
	return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
}

// Отмечает заход в момент now и, если countTime, добавляет время с прошлой отметки.
// saved — прошлая статистика (null — первый визит). Исходный объект не меняется
export function advance(saved: VisitStats | null, now: number, countTime: boolean): VisitStats {
	const today = dayKey(now);
	const stats: VisitStats = saved
		? { ...saved }
		: { lastDay: today, streak: 1, best: 1, todayMs: 0, totalMs: 0, lastTick: now };

	// Новый день: вчера заходил — серия продолжается, иначе начинается заново
	if (stats.lastDay !== today) {
		stats.streak = daysBetween(stats.lastDay, today) === 1 ? stats.streak + 1 : 1;
		stats.best = Math.max(stats.best, stats.streak);
		stats.todayMs = 0;
		stats.lastDay = today;
	}

	const gap = now - stats.lastTick;
	if (countTime && gap > 0 && gap <= maxGapMs) {
		stats.todayMs += gap;
		stats.totalMs += gap;
	}
	stats.lastTick = now;

	return stats;
}
