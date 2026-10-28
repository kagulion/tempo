// Загрузка YouTube IFrame Player API. Скрипт подключаем один раз и только когда он нужен:
// посетителям без видео с YouTube он ни к чему

// Только то, чем мы пользуемся; полные типы лежат в @types/youtube, но ради этого пакет не нужен
export type YouTubePlayer = {
	destroy: () => void;
	mute: () => void;
	unMute: () => void;
	// От 0 до 100
	setVolume: (volume: number) => void;
	playVideo: () => void;
	pauseVideo: () => void;
	seekTo: (seconds: number, allowSeekAhead: boolean) => void;
	// Секунды от начала видео
	getCurrentTime: () => number;
	// isLive нет в документации, но плеер его отдаёт: true у прямой трансляции
	// Длительность в секундах; до загрузки метаданных 0
	getDuration: () => number;
	setPlaybackRate: (rate: number) => void;
	getPlaybackRate: () => number;
	getAvailablePlaybackRates: () => number[];
	// Одно из значений PlayerState; -1 — ещё не начинал
	getPlayerState: () => number;
	isMuted: () => boolean;
	getVolume: () => number;
	getVideoData: () => { title?: string; isLive?: boolean };
};

export type YouTubePlayerOptions = {
	host: string;
	videoId: string;
	width: string;
	height: string;
	playerVars: Record<string, string | number>;
	events: {
		onReady: () => void;
		onStateChange: (event: { data: number }) => void;
		onError: (event: { data: number }) => void;
	};
};

export type YouTubeApi = {
	Player: new (element: HTMLElement, options: YouTubePlayerOptions) => YouTubePlayer;
	PlayerState: {
		ENDED: number;
		PLAYING: number;
		PAUSED: number;
		BUFFERING: number;
		CUED: number;
	};
};

declare global {
	interface Window {
		YT?: Partial<YouTubeApi>;
		onYouTubeIframeAPIReady?: () => void;
	}
}

const scriptUrl = 'https://www.youtube.com/iframe_api';

function isLoaded(api: Window['YT']): api is YouTubeApi {
	return api?.Player !== undefined && api.PlayerState !== undefined;
}

let loading: Promise<YouTubeApi> | undefined;

// Один промис на всю страницу. Если скрипт не загрузился (нет сети, заблокирован), следующий вызов пробует снова
export function loadYouTubeApi(): Promise<YouTubeApi> {
	if (isLoaded(window.YT)) return Promise.resolve(window.YT);
	if (loading) return loading;

	loading = new Promise<YouTubeApi>((resolve, reject) => {
		// Колбэк глобальный, им могла уже пользоваться другая библиотека: не затираем её
		const previous = window.onYouTubeIframeAPIReady;
		window.onYouTubeIframeAPIReady = () => {
			previous?.();
			if (isLoaded(window.YT)) resolve(window.YT);
			else reject(new Error('YouTube API не появился после загрузки'));
		};

		const script = document.createElement('script');
		script.src = scriptUrl;
		script.async = true;
		script.onerror = () => {
			script.remove();
			window.onYouTubeIframeAPIReady = previous;
			reject(new Error('Не удалось загрузить YouTube API'));
		};
		document.head.append(script);
	});
	// После ошибки забываем промис, чтобы следующий вызов мог попробовать снова
	loading.catch(() => {
		loading = undefined;
	});
	return loading;
}
