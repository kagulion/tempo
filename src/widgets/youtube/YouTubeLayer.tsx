import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { useDuckLevel } from '@/hooks/useDuckLevel';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useUserActivation } from '@/hooks/useUserActivation';
import { mediaQueries } from '@/lib/media';
import { cn } from '@/lib/utils';

import { audioTarget, pauseFromPlayer, shouldPause, wantsSound } from './playback';
import { coverScale, qualityFrameSize } from './quality';
import type { YouTubeWallpaper } from '@/widgets/wallpaper/wallpapers';
import { youtubeErrorMessage } from './youtube';
import { loadYouTubeApi, type YouTubePlayer } from './youtubeApi';
import { setPaused, useYouTubePlayback } from './youtubePlayback';

// Если видео не заиграло за это время (автозапуск запрещён, плохая сеть), показываем хотя бы превью
const startTimeoutMs = 10_000;

// Iframe растягиваем как object-cover: 16:9, не меньше экрана по обеим сторонам, по центру
const iframeClass = cn(
	'[&_iframe]:absolute [&_iframe]:top-1/2 [&_iframe]:left-1/2 [&_iframe]:max-w-none [&_iframe]:-translate-1/2',
	'[&_iframe]:h-[max(100dvh,56.25vw)] [&_iframe]:w-[max(100vw,177.78dvh)]'
);

// Размер окна для масштаба iframe с потолком качества. Строка, чтобы useSyncExternalStore видел, что ничего не менялось
function subscribeResize(listener: () => void) {
	window.addEventListener('resize', listener);
	return () => window.removeEventListener('resize', listener);
}

function viewportKey() {
	return `${window.innerWidth}x${window.innerHeight}`;
}

function useViewport() {
	const [width, height] = useSyncExternalStore(subscribeResize, viewportKey).split('x').map(Number);
	return { width, height };
}

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
	const { paused, soundOn, quality } = useYouTubePlayback();
	const duck = useDuckLevel();
	const unlocked = useUserActivation();
	const viewport = useViewport();
	// Потолок качества: iframe своего размера, растянутый на экран. undefined — «Авто», iframe во весь экран
	const frame = qualityFrameSize(quality);
	// Плеер выбирает качество при загрузке и потом размер iframe не замечает, поэтому смена качества пересоздаёт плеер
	const frameKey = frame ? `${frame.width}x${frame.height}` : 'auto';
	// Откуда продолжить после пересоздания плеера, чтобы видео не начиналось заново
	const resumeAt = useRef<number>(undefined);

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
		// Когда последний раз командовали паузой или запуском: события сразу после — отклик на команду
		let commandAt = Number.NEGATIVE_INFINITY;

		function command(pause: boolean) {
			if (!player) return;
			commandAt = performance.now();
			if (pause) player.pauseVideo();
			else player.playVideo();
		}

		// Видео звучит: тогда в скрытой вкладке оно не встаёт, как фоновая музыка
		function audible() {
			return wantsSound({
				soundOn: latest.current.soundOn,
				unlocked: latest.current.unlocked,
				active: latest.current.soundAllowed
			});
		}

		// Видео остановили или запустили в обход кнопки окна (клавиши мультимедиа, системный плеер):
		// кнопка должна показывать то, что на самом деле. Возвращает true, если событие так и объяснилось
		function followPlayer(state: 'playing' | 'paused') {
			const next = pauseFromPlayer({
				state,
				appliedPause,
				// Звучащее видео в скрытой вкладке мы не останавливаем: пауза там — это клавиши мультимедиа
				hidden: document.hidden && !audible(),
				started,
				sinceCommandMs: performance.now() - commandAt
			});
			if (next === undefined) return false;
			appliedPause = next;
			setPaused(next);
			return true;
		}

		// Видео стоит на паузе, если её нажали, вкладка скрыта и видео без звука или включено «уменьшить движение» (тогда первый кадр)
		function syncPlayback() {
			if (!player || !playerReady) return;
			const pause = shouldPause({
				paused: latest.current.paused,
				hidden: document.hidden,
				audible: audible(),
				reducedMotion: latest.current.reducedMotion
			});
			if (pause === appliedPause) return;
			appliedPause = pause;
			command(pause);
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
		// После смены качества продолжаем с того же места. Метка одноразовая: новое видео начнётся со своего start
		const from = resumeAt.current ?? start;
		resumeAt.current = undefined;

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
						...(from === undefined ? {} : { start: from })
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
								if (!followPlayer('playing') && appliedPause) command(true);
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
							} else if (data === api.PlayerState.PAUSED) {
								followPlayer('paused');
							} else if (data === api.PlayerState.ENDED) {
								// Свой цикл вместо параметра loop: так видео возвращается к метке старта, а не в начало
								player.seekTo(start ?? 0, true);
								command(false);
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
			// Пока новый плеер грузится, видно превью, а не чёрный iframe
			setPlaying(false);
			try {
				// Трансляции не продолжаем с метки: новый плеер сам встанет на прямой эфир
				if (player && started && !player.getVideoData().isLive) {
					resumeAt.current = Math.floor(player.getCurrentTime());
				}
			} catch {
				// Плеер не ответил — начнём со start
			}
			try {
				player?.destroy();
			} catch {
				// Плеер уже разрушен или не успел создаться — убирать нечего
			}
		};
	}, [videoId, start, frameKey]);

	// Эффекты объявлены после «latest», поэтому видят уже свежие значения
	useEffect(() => {
		syncRef.current.playback();
		// Звук решает, играть ли в скрытой вкладке
	}, [reducedMotion, paused, soundOn, unlocked, soundAllowed]);

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
				style={
					frame && {
						width: frame.width,
						height: frame.height,
						transform: `translate(-50%, -50%) scale(${coverScale(frame, viewport)})`
					}
				}
				className={cn(
					'opacity-0 transition-opacity duration-700',
					playing && 'opacity-100',
					frame
						? 'absolute top-1/2 left-1/2 [&_iframe]:h-full [&_iframe]:w-full'
						: cn('absolute inset-0', iframeClass)
				)}
			/>
		</div>
	);
}
