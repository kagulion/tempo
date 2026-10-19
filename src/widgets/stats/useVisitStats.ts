import { useSyncExternalStore } from 'react';

import { createLiveStore } from '@/lib/liveStore';
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

// Один таймер на всю страницу, пока есть хоть один читатель (окно статистики, хайлайты).
// Первая отметка ничего не добавляет: время до неё сайт был закрыт
const visitStore = createLiveStore<VisitStats>(
	() => update(Date.now(), false),
	(set) => {
		const id = window.setInterval(() => set(update(Date.now(), true)), tickMs);
		return () => window.clearInterval(id);
	}
);

// Серия дней и время на сайте. Время идёт, пока открыта хотя бы одна вкладка, даже фоновая
export function useVisitStats() {
	return useSyncExternalStore(visitStore.subscribe, visitStore.get);
}

// Держит учёт включённым без React: время и серия идут, даже если окно статистики и хайлайты не показаны
// (закрытое окно, экран меньше xl, режим фокуса). Вызывать один раз в App; возвращает отписку
export function keepVisitStatsRunning() {
	return visitStore.subscribe(() => {});
}
