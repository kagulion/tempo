import { useEffect, useState } from 'react';

import { isRecord, loadStored, saveStored, storageKeys } from '@/lib/storage';

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

const tickMs = 1000;
// Фоновые вкладки браузер будит примерно раз в минуту. Разрыв длиннее — сайт был закрыт или компьютер спал
const maxGapMs = 65_000;

// Запасное хранилище, если localStorage недоступен (приватный режим): статистика живёт до перезагрузки
let memory: VisitStats | null = null;

function dayKey(time: number) {
	const date = new Date(time);
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${date.getFullYear()}-${month}-${day}`;
}

// Разница в календарных днях между двумя ключами dayKey
function daysBetween(from: string, to: string) {
	return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
}

function parseStats(saved: unknown): VisitStats | undefined {
	return isRecord(saved) && typeof saved.lastDay === 'string' && typeof saved.lastTick === 'number'
		? (saved as VisitStats)
		: undefined;
}

function load() {
	return loadStored<VisitStats | null>(storageKeys.stats, memory, parseStats);
}

// Хранилище недоступно — остаётся копия в памяти
function save(stats: VisitStats) {
	memory = stats;
	saveStored(storageKeys.stats, stats);
}

// Отмечает заход сегодня и, если countTime, добавляет время с прошлой отметки
function update(now: number, countTime: boolean): VisitStats {
	const today = dayKey(now);
	const saved = load();
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

	save(stats);
	return stats;
}

// Серия дней и время на сайте. Время идёт, пока открыта хотя бы одна вкладка, даже фоновая
export function useVisitStats() {
	// Первая отметка ничего не добавляет: время до неё сайт был закрыт
	const [stats, setStats] = useState(() => update(Date.now(), false));

	useEffect(() => {
		const id = window.setInterval(() => setStats(update(Date.now(), true)), tickMs);
		return () => window.clearInterval(id);
	}, []);

	return stats;
}
