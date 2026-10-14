import { useEffect, useState } from 'react';

import { isRecord, loadStored, saveStored, storageKeys } from '@/lib/storage';

import { advance, type VisitStats } from './visits';

const tickMs = 1000;

// Запасное хранилище, если localStorage недоступен (приватный режим): статистика живёт до перезагрузки
let memory: VisitStats | null = null;

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
function update(now: number, countTime: boolean) {
	const stats = advance(load(), now, countTime);
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
