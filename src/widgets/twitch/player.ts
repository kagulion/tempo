// Загрузка официального скрипта плеера Twitch и его минимальные типы. Plain-модуль без React

export const twitchScriptUrl = 'https://player.twitch.tv/js/embed/v1.js';

// Только то, чем пользуется слой фона
export type TwitchPlayer = {
	addEventListener(event: string, callback: () => void): void;
	play(): void;
	pause(): void;
	setMuted(muted: boolean): void;
	setVolume(volume: number): void;
	destroy?: () => void;
};

export type TwitchPlayerOptions = {
	channel: string;
	parent: string[];
	autoplay: boolean;
	muted: boolean;
	width: string;
	height: string;
};

export type TwitchGlobal = {
	Player: {
		new (element: HTMLElement | string, options: TwitchPlayerOptions): TwitchPlayer;
		READY: string;
		ONLINE: string;
		OFFLINE: string;
		PLAYING: string;
		PAUSE: string;
		PLAYBACK_BLOCKED: string;
	};
};

declare global {
	interface Window {
		Twitch?: TwitchGlobal;
	}
}

let loading: Promise<TwitchGlobal> | undefined;

// Подгружает v1.js один раз по требованию: повторные вызовы ждут тот же Promise.
// Ошибка загрузки не запоминается, чтобы следующая попытка могла сработать
export function loadTwitch(): Promise<TwitchGlobal> {
	if (window.Twitch?.Player) return Promise.resolve(window.Twitch);
	loading ??= new Promise<TwitchGlobal>((resolve, reject) => {
		const script = document.createElement('script');
		script.src = twitchScriptUrl;
		script.async = true;
		script.onload = () => {
			if (window.Twitch?.Player) resolve(window.Twitch);
			else reject(new Error('Twitch.Player не найден'));
		};
		script.onerror = () => reject(new Error('Скрипт Twitch не загрузился'));
		document.head.append(script);
	}).catch((error: unknown) => {
		loading = undefined;
		document.querySelector(`script[src="${twitchScriptUrl}"]`)?.remove();
		throw error;
	});
	return loading;
}
