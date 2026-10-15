import { useSyncExternalStore } from 'react';

import { countryName } from './api';

// Текущая станция радио. Нужна не только радио: крупные часы показывают её под датой и могут включить или
// выключить звук. Станция держится и на паузе. playing — намерение пользователя (радио включено),
// audible — звук реально идёт. Нет радио или станции — null.
// Хранится только в памяти, в localStorage не пишем — это текущее состояние, а не настройка
export type NowPlaying = {
	name: string;
	countrycode: string;
	playing: boolean;
	audible: boolean;
} | null;

const fallbackName = 'Без названия';

let current: NowPlaying = null;
// Переключатель радио: его регистрирует useRadio, пока смонтирован
let toggleHandler: (() => void) | null = null;
const listeners = new Set<() => void>();

function notify() {
	listeners.forEach((listener) => listener());
}

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
			current.countrycode === next.countrycode &&
			current.playing === next.playing &&
			current.audible === next.audible);
	if (same) return;
	current = next;
	notify();
}

export function subscribeNowPlaying(listener: () => void) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

// Радио регистрирует свой переключатель при монтировании и снимает при размонтировании.
// Возвращает функцию снятия. Снимает только свой обработчик: если уже зарегистрирован другой, он остаётся
export function registerNowPlayingToggle(handler: () => void) {
	toggleHandler = handler;
	notify();
	return () => {
		if (toggleHandler !== handler) return;
		toggleHandler = null;
		notify();
	};
}

export function hasNowPlayingToggle() {
	return toggleHandler !== null;
}

// Включает или выключает радио. Без обработчика ничего не делает
export function toggleNowPlaying() {
	toggleHandler?.();
}

// Название (с запасным) и страна по отдельности: название обрезается многоточием, страна — нет.
// Без кода страны country пустая
export function nowPlayingParts(station: { name: string; countrycode: string }) {
	return {
		name: station.name.trim() || fallbackName,
		country: station.countrycode ? countryName(station.countrycode) : ''
	};
}

// Текст для строки «Станция · Страна». Без названия или кода страны — только то, что есть
export function nowPlayingLabel(station: { name: string; countrycode: string }) {
	const { name, country } = nowPlayingParts(station);
	return country ? `${name} · ${country}` : name;
}

export function useNowPlaying() {
	return useSyncExternalStore(subscribeNowPlaying, getNowPlaying);
}

// Есть ли у кого-то переключатель: без него кнопку play/пауза не показываем
export function useCanToggleNowPlaying() {
	return useSyncExternalStore(subscribeNowPlaying, hasNowPlayingToggle);
}
