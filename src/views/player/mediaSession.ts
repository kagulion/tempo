import { applyMediaInfo } from '@/widgets/radio/mediaSession';

// Системный плеер (Media Session API) для пластинки: название, «YouTube» как исполнитель, картинка диска.
// Метаданные отдаём тем же applyMediaInfo, что и радио: он общий. Обработчики кнопок свои

export type MediaHandlers = {
	play: () => void;
	pause: () => void;
	previous: () => void;
	next: () => void;
};

function supported() {
	return typeof navigator !== 'undefined' && 'mediaSession' in navigator;
}

export function showMedia(title: string, artwork: string | undefined) {
	applyMediaInfo({
		title,
		artist: 'YouTube',
		album: 'Проигрыватель Tempo',
		artwork: artwork ? [{ src: artwork }] : []
	});
}

export function clearMedia() {
	applyMediaInfo(null);
	if (supported()) navigator.mediaSession.playbackState = 'none';
}

export function setMediaPlaying(playing: boolean) {
	if (supported()) navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
}

// Вешает обработчики кнопок; возвращает функцию, которая их снимает
export function bindMediaHandlers(handlers: MediaHandlers) {
	if (!supported()) return () => {};
	const actions: [MediaSessionAction, () => void][] = [
		['play', handlers.play],
		['pause', handlers.pause],
		['previoustrack', handlers.previous],
		['nexttrack', handlers.next]
	];
	for (const [action, handler] of actions) {
		try {
			navigator.mediaSession.setActionHandler(action, handler);
		} catch {
			// Браузер не знает такого действия
		}
	}
	return () => {
		for (const [action] of actions) {
			try {
				navigator.mediaSession.setActionHandler(action, null);
			} catch {
				// Уже снято
			}
		}
	};
}
