import { useSyncExternalStore } from 'react';

import { countryName } from './api';

// Станция, которая сейчас реально звучит. Нужна не только радио: крупные часы показывают её под датой.
// Хранится только в памяти, в localStorage не пишем — это текущее состояние, а не настройка
export type NowPlaying = { name: string; countrycode: string } | null;

const fallbackName = 'Без названия';

let current: NowPlaying = null;
const listeners = new Set<() => void>();

export function getNowPlaying() {
	return current;
}

// Одинаковое значение не рассылаем, чтобы подписчики не перерисовывались впустую
export function setNowPlaying(next: NowPlaying) {
	const same =
		current === next ||
		(current !== null &&
			next !== null &&
			current.name === next.name &&
			current.countrycode === next.countrycode);
	if (same) return;
	current = next;
	listeners.forEach((listener) => listener());
}

export function subscribeNowPlaying(listener: () => void) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

// Текст для строки «Станция · Страна». Без названия или кода страны — только то, что есть
export function nowPlayingLabel(station: { name: string; countrycode: string }) {
	const name = station.name.trim() || fallbackName;
	const country = station.countrycode ? countryName(station.countrycode) : '';
	return country ? `${name} · ${country}` : name;
}

export function useNowPlaying() {
	return useSyncExternalStore(subscribeNowPlaying, getNowPlaying);
}
