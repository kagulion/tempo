import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

import { useDuckLevel } from '@/hooks/useDuckLevel';
import { useUserActivation } from '@/hooks/useUserActivation';
import { loadYouTubeApi, type YouTubePlayer } from '@/lib/youtube/api';
import { youtubeErrorMessage } from '@/widgets/youtube/youtube';

import type { Disc } from './collection';
import { positionSaveMs, resumeFrom } from './progress';

// idle — пластинки нет; loading — плеер грузится; paused — стоит (в том числе когда браузер не дал автозапуск)
export type PlayerStatus =
	'idle' | 'loading' | 'playing' | 'buffering' | 'paused' | 'ended' | 'error';

type UsePlayerOptions = {
	disc: Disc | undefined;
	// Контейнер, в который плеер вставит свой iframe
	hostRef: RefObject<HTMLDivElement | null>;
	// 0..100
	volume: number;
	muted: boolean;
	rate: number;
	// Название, которое плеер сообщил после старта
	onTitle: (id: string, title: string) => void;
	// Где остановились (сек.); 0 — досмотрели, места нет
	onPosition: (id: string, seconds: number) => void;
	onEnded: () => void;
	onError: (message: string) => void;
};

// Один плеер YouTube на страницу, который пересоздаётся при смене пластинки.
// Плеер всегда стартует без звука (иначе браузер не даст запустить видео), звук включается после действия пользователя
export function usePlayer(options: UsePlayerOptions) {
	const { disc, hostRef, volume, muted, rate } = options;
	const videoId = disc?.videoId;
	const discId = disc?.id;

	const [status, setStatus] = useState<PlayerStatus>(videoId ? 'loading' : 'idle');
	const [time, setTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const playerRef = useRef<YouTubePlayer | undefined>(undefined);
	const unlocked = useUserActivation();
	const duck = useDuckLevel();

	// Свежие значения для плеера, который создаётся один раз на пластинку
	const latest = useRef({ ...options, unlocked, duck });
	useEffect(() => {
		latest.current = { ...options, unlocked, duck };
	});
	const syncRef = useRef({ audio: () => {}, rate: () => {} });

	useEffect(() => {
		const host = hostRef.current;
		if (!host || !videoId || !discId) {
			setStatus('idle');
			setTime(0);
			setDuration(0);
			return;
		}

		let disposed = false;
		let player: YouTubePlayer | undefined;
		let ready = false;
		let state: PlayerStatus = 'loading';
		let titled = false;
		let lastSaveAt = performance.now();
		let appliedMuted: boolean | undefined;
		let appliedVolume: number | undefined;

		setStatus('loading');
		setTime(0);
		setDuration(0);

		function savePosition(reset = false) {
			// Досмотренная пластинка уже сбросила место: конец видео не запоминаем
			if (!player || !ready || (state === 'ended' && !reset)) return;
			try {
				latest.current.onPosition(discId!, reset ? 0 : Math.floor(player.getCurrentTime()));
			} catch {
				// Плеер не ответил — место не сохраняем
			}
			lastSaveAt = performance.now();
		}

		function setState(next: PlayerStatus) {
			state = next;
			setStatus(next);
		}

		function syncAudio() {
			if (!player || !ready) return;
			const { volume, muted, unlocked, duck } = latest.current;
			const level = Math.round(volume * duck);
			// Пока не было действия пользователя, звук включать нельзя: браузер остановит видео
			const silent = muted || !unlocked || level === 0;
			if (silent) {
				if (appliedMuted !== true) player.mute();
				appliedMuted = true;
				return;
			}
			if (level !== appliedVolume) player.setVolume(level);
			appliedVolume = level;
			if (appliedMuted !== false) player.unMute();
			appliedMuted = false;
		}

		function syncRate() {
			if (!player || !ready) return;
			const wanted = latest.current.rate;
			if (player.getPlaybackRate() !== wanted) player.setPlaybackRate(wanted);
		}
		syncRef.current = { audio: syncAudio, rate: syncRate };

		// Время обновляем четыре раза в секунду и только пока видно вкладку и пластинка играет
		const tick = window.setInterval(() => {
			if (!player || !ready || document.hidden) return;
			if (state !== 'playing' && state !== 'buffering') return;
			try {
				setTime(player.getCurrentTime());
				setDuration(player.getDuration());
				if (performance.now() - lastSaveAt >= positionSaveMs) savePosition();
			} catch {
				// Плеер ещё не готов отвечать
			}
		}, 250);

		function onHide() {
			if (document.hidden) savePosition();
		}
		function onPageHide() {
			savePosition();
		}
		document.addEventListener('visibilitychange', onHide);
		window.addEventListener('pagehide', onPageHide);

		const from = resumeFrom(latest.current.disc?.position, latest.current.disc?.start);

		loadYouTubeApi().then(
			(api) => {
				if (disposed) return;
				// Плеер заменяет переданный элемент iframe-ом, поэтому отдаём ему свой, а не узел React
				const target = document.createElement('div');
				host.append(target);

				player = new api.Player(target, {
					host: 'https://www.youtube-nocookie.com',
					videoId,
					// Меньше 200×200 YouTube не разрешает; маленький кадр заодно экономит трафик
					width: '200',
					height: '200',
					playerVars: {
						autoplay: 1,
						mute: 1,
						controls: 0,
						disablekb: 1,
						playsinline: 1,
						rel: 0,
						iv_load_policy: 3,
						fs: 0,
						origin: window.location.origin,
						...(from === undefined ? {} : { start: from })
					},
					events: {
						onReady: () => {
							if (disposed) return;
							ready = true;
							// Окошко с видео не должно ловить Tab: управление — кнопки страницы
							const frame = host.querySelector('iframe');
							if (frame) {
								frame.tabIndex = -1;
								frame.title = 'Видео YouTube';
							}
							syncAudio();
							syncRate();
							setDuration(player?.getDuration() ?? 0);
						},
						onStateChange: ({ data }) => {
							if (disposed || !player) return;
							if (data === api.PlayerState.PLAYING) {
								setState('playing');
								syncRate();
								setDuration(player.getDuration());
								if (!titled) {
									const title = player.getVideoData().title?.trim();
									if (title) {
										titled = true;
										latest.current.onTitle(discId, title);
									}
								}
							} else if (data === api.PlayerState.BUFFERING) {
								setState('buffering');
							} else if (data === api.PlayerState.PAUSED) {
								setState('paused');
								savePosition();
							} else if (data === api.PlayerState.ENDED) {
								setState('ended');
								savePosition(true);
								latest.current.onEnded();
							} else {
								// Не начинал или поставлен в очередь: автозапуск не сработал, ждём кнопку
								setState('paused');
							}
						},
						onError: ({ data }) => {
							if (disposed) return;
							setState('error');
							latest.current.onError(youtubeErrorMessage(data));
						}
					}
				});
				playerRef.current = player;
			},
			() => {
				if (disposed) return;
				setState('error');
				latest.current.onError('Не удалось загрузить плеер YouTube');
			}
		);

		return () => {
			savePosition();
			disposed = true;
			window.clearInterval(tick);
			document.removeEventListener('visibilitychange', onHide);
			window.removeEventListener('pagehide', onPageHide);
			syncRef.current = { audio: () => {}, rate: () => {} };
			playerRef.current = undefined;
			try {
				player?.destroy();
			} catch {
				// Плеер уже разрушен или не успел создаться — убирать нечего
			}
		};
	}, [hostRef, videoId, discId]);

	// Эффекты объявлены после «latest», поэтому видят уже свежие значения
	useEffect(() => {
		syncRef.current.audio();
	}, [volume, muted, unlocked, duck]);

	useEffect(() => {
		syncRef.current.rate();
	}, [rate]);

	const play = useCallback(() => {
		const player = playerRef.current;
		if (!player) return;
		if (player.getPlayerState() === 0) player.seekTo(0, true);
		player.playVideo();
	}, []);

	const pause = useCallback(() => {
		playerRef.current?.pauseVideo();
	}, []);

	const seek = useCallback((seconds: number) => {
		const player = playerRef.current;
		if (!player) return;
		player.seekTo(seconds, true);
		setTime(seconds);
	}, []);

	// Сдвиг от текущего места плеера, а не от последнего показанного времени
	const current = useCallback(() => playerRef.current?.getCurrentTime() ?? 0, []);
	const total = useCallback(() => playerRef.current?.getDuration() ?? 0, []);

	return { status, time, duration, play, pause, seek, current, total };
}
