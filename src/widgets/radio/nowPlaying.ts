import { useSyncExternalStore } from 'react';

// Текущая станция радио. Нужна не только радио: крупные часы показывают её под датой и могут включить или
// выключить звук. Станция держится и на паузе. playing — намерение пользователя (радио включено),
// audible — звук реально идёт. Нет радио или станции — null.
// Хранится только в памяти, в localStorage не пишем — это текущее состояние, а не настройка
export type NowPlayingTrack = {
	artist: string;
	song: string;
	cover?: string;
};

// track — что играет на станции сейчас; его нет, пока прокси Рекорда не отвечает
export type NowPlaying = {
	name: string;
	playing: boolean;
	audible: boolean;
	track?: NowPlayingTrack;
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

function sameTrack(a: NowPlayingTrack | undefined, b: NowPlayingTrack | undefined) {
	return (
		a === b || (!!a && !!b && a.artist === b.artist && a.song === b.song && a.cover === b.cover)
	);
}

// Одинаковое значение не рассылаем, чтобы подписчики не перерисовывались впустую
export function setNowPlaying(next: NowPlaying) {
	const same =
		current === next ||
		(current !== null &&
			next !== null &&
			current.name === next.name &&
			current.playing === next.playing &&
			current.audible === next.audible &&
			sameTrack(current.track, next.track));
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

// Название станции для подписи под часами; пустое заменяется запасным
export function nowPlayingName(station: { name: string }) {
	return station.name.trim() || fallbackName;
}

// Подпись трека: «Исполнитель — Песня», без исполнителя только песня
export function trackLabel(track: NowPlayingTrack) {
	const artist = track.artist.trim();
	const song = track.song.trim();
	return artist && song ? `${artist} — ${song}` : artist || song;
}

export function useNowPlaying() {
	return useSyncExternalStore(subscribeNowPlaying, getNowPlaying);
}

// Есть ли у кого-то переключатель: без него кнопку play/пауза не показываем
export function useCanToggleNowPlaying() {
	return useSyncExternalStore(subscribeNowPlaying, hasNowPlayingToggle);
}

// Фраза для скринридера при смене станции или старте. Нет станции — пустая строка (ничего не объявляем)
export function stationAnnouncement(title: string | undefined) {
	if (title === undefined) return '';
	return `Играет: ${title.trim() || fallbackName}`;
}
