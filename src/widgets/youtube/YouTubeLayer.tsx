import { useEffect, useRef, useState } from 'react';

import { useDuckLevel } from '@/hooks/useDuckLevel';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useUserActivation } from '@/hooks/useUserActivation';
import { mediaQueries } from '@/lib/media';
import { cn } from '@/lib/utils';

import { audioTarget, shouldPause } from './playback';
import type { YouTubeWallpaper } from '@/widgets/wallpaper/wallpapers';
import { youtubeErrorMessage } from './youtube';
import { loadYouTubeApi, type YouTubePlayer } from './youtubeApi';
import { useYouTubePlayback } from './youtubePlayback';

// Если видео не заиграло за это время (автозапуск запрещён, плохая сеть), показываем хотя бы превью
const startTimeoutMs = 10_000;

// Iframe растягиваем как object-cover: 16:9, не меньше экрана по обеим сторонам, по центру
const iframeClass = cn(
	'[&_iframe]:absolute [&_iframe]:top-1/2 [&_iframe]:left-1/2 [&_iframe]:max-w-none [&_iframe]:-translate-1/2',
	'[&_iframe]:h-[max(100vh,56.25vw)] [&_iframe]:w-[max(100vw,177.78vh)]'
);

type YouTubeLayerProps = {
	wallpaper: YouTubeWallpaper;
	// Слой главный: выбран и уже проявился. Звук нужен только ему, чтобы два видео не звучали вместе
	soundAllowed: boolean;
	// Видео пошло: слой можно проявлять
	onReady: () => void;
	// Слой проявился до конца
	onShown?: () => void;
	// permanent: ошибка самого видео. Если false, не загрузился плеер: возможно, нет сети, и выбор лучше не трогать
	onError: (message: string, permanent: boolean) => void;
	// Название, которое плеер сообщил после старта
	onTitle: (title: string) => void;
	className?: string;
};

// Слой фона с видео YouTube. Плеер всегда стартует без звука (иначе браузер не даст запустить видео),
// звук включается позже, если посетитель его включил. Под плеером лежит превью: оно видно, пока плеер грузится
export function YouTubeLayer({
	wallpaper,
	soundAllowed,
	onReady,
	onShown,
	onError,
	onTitle,
	className
}: YouTubeLayerProps) {
	const { videoId, start } = wallpaper;
	const hostRef = useRef<HTMLDivElement>(null);
	const reducedMotion = useMediaQuery(mediaQueries.reducedMotion);
	const [playing, setPlaying] = useState(false);
	const { paused, soundOn } = useYouTubePlayback();
	const duck = useDuckLevel();
	const unlocked = useUserActivation();

	// Колбэки приходят заново при каждой отрисовке; плеер создаём один раз и берём из ссылки свежие
	const callbacks = useRef({ onReady, onError, onTitle });
	useEffect(() => {
		callbacks.current = { onReady, onError, onTitle };
	});

	// Свежие значения для плеера, который создаётся один раз
	const latest = useRef({ reducedMotion, paused, soundOn, unlocked, soundAllowed, duck });
	useEffect(() => {
		latest.current = { reducedMotion, paused, soundOn, unlocked, soundAllowed, duck };
	});
	// Пауза и звук применяются отдельно: громкость меняется каждые 100 мс, пока таймер приглушает звук
	const syncRef = useRef({ playback: () => {}, audio: () => {} });

	useEffect(() => {
		const host = hostRef.current;
		if (!host) return;

		let disposed = false;
		let player: YouTubePlayer | undefined;
		let playerReady = false;
		let started = false;
		let titled = false;
		let revealed = false;

		function reveal() {
			if (revealed) return;
			revealed = true;
			callbacks.current.onReady();
		}

		// Что уже сказали плееру: повторять одно и то же незачем
		let appliedPause: boolean | undefined;
		let appliedMuted: boolean | undefined;
		let appliedVolume: number | undefined;

		// Видео стоит на паузе, если её нажали, вкладка скрыта или включено «уменьшить движение» (тогда первый кадр)
		function syncPlayback() {
			if (!player || !playerReady) return;
			const pause = shouldPause({
				paused: latest.current.paused,
				hidden: document.hidden,
				reducedMotion: latest.current.reducedMotion
			});
			if (pause === appliedPause) return;
			appliedPause = pause;
			if (pause) player.pauseVideo();
			else player.playVideo();
		}

		function syncAudio() {
			if (!player || !playerReady) return;
			const target = audioTarget({
				soundOn: latest.current.soundOn,
				unlocked: latest.current.unlocked,
				active: latest.current.soundAllowed,
				duck: latest.current.duck
			});
			if (target.muted) {
				if (appliedMuted !== true) player.mute();
				appliedMuted = true;
				return;
			}
			if (target.volume !== appliedVolume) player.setVolume(target.volume);
			appliedVolume = target.volume;
			if (appliedMuted !== false) player.unMute();
			appliedMuted = false;
		}

		function sync() {
			syncPlayback();
			syncAudio();
		}
		syncRef.current = { playback: syncPlayback, audio: syncAudio };

		const timeout = setTimeout(reveal, startTimeoutMs);

		loadYouTubeApi().then(
			(api) => {
				if (disposed) return;
				// Плеер заменяет переданный элемент iframe-ом, поэтому отдаём ему свой, а не узел React
				const target = document.createElement('div');
				host.append(target);

				player = new api.Player(target, {
					host: 'https://www.youtube-nocookie.com',
					videoId,
					width: '100%',
					height: '100%',
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
						...(start === undefined ? {} : { start })
					},
					events: {
						onReady: () => {
							if (disposed) return;
							playerReady = true;
							sync();
						},
						onStateChange: ({ data }) => {
							if (disposed || !player) return;
							if (data === api.PlayerState.PLAYING) {
								// Автозапуск мог сработать уже после паузы: вкладку скрыли или нажали паузу, пока видео грузилось
								if (appliedPause) player.pauseVideo();
								if (!started) {
									started = true;
									setPlaying(true);
									reveal();
								}
								if (!titled) {
									const title = player.getVideoData().title?.trim();
									if (title) {
										titled = true;
										callbacks.current.onTitle(title);
									}
								}
							} else if (data === api.PlayerState.ENDED) {
								// Свой цикл вместо параметра loop: так видео возвращается к метке старта, а не в начало
								player.seekTo(start ?? 0, true);
								player.playVideo();
							}
						},
						onError: ({ data }) => {
							if (disposed) return;
							callbacks.current.onError(youtubeErrorMessage(data), true);
						}
					}
				});
			},
			() => {
				if (!disposed) {
					callbacks.current.onError('Не удалось загрузить плеер YouTube', false);
				}
			}
		);

		document.addEventListener('visibilitychange', syncPlayback);
		return () => {
			disposed = true;
			clearTimeout(timeout);
			document.removeEventListener('visibilitychange', syncPlayback);
			syncRef.current = { playback: () => {}, audio: () => {} };
			try {
				player?.destroy();
			} catch {
				// Плеер уже разрушен или не успел создаться — убирать нечего
			}
		};
	}, [videoId, start]);

	// Эффекты объявлены после «latest», поэтому видят уже свежие значения
	useEffect(() => {
		syncRef.current.playback();
	}, [reducedMotion, paused]);

	useEffect(() => {
		syncRef.current.audio();
	}, [soundOn, unlocked, soundAllowed, duck]);

	return (
		<div
			// Слой только для просмотра: клики и фокус не должны попадать в плеер
			aria-hidden
			onAnimationEnd={(event) => {
				if (event.target === event.currentTarget) onShown?.();
			}}
			className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
		>
			<img
				src={wallpaper.thumb}
				alt=""
				className="absolute inset-0 h-full w-full object-cover"
				draggable={false}
			/>
			{/* Iframe скрыт, пока видео не пошло: иначе мелькнут заставка и название */}
			<div
				ref={hostRef}
				className={cn(
					'absolute inset-0 opacity-0 transition-opacity duration-700',
					playing && 'opacity-100',
					iframeClass
				)}
			/>
		</div>
	);
}
