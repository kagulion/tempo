import { useCallback, useEffect, useRef } from 'react';

import { useDuckLevel } from '@/hooks/useDuckLevel';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useUserActivation } from '@/hooks/useUserActivation';
import { mediaQueries } from '@/lib/media';
import { cn } from '@/lib/utils';
import type { TvWallpaper } from '@/widgets/wallpaper/wallpapers';
import { audioTarget, shouldPause, wantsSound } from '@/widgets/youtube/playback';

import { tvErrors, tvStartTimeoutMs } from './tv';
import { useTvPlayback } from './tvPlayback';

type TvLayerProps = {
	wallpaper: TvWallpaper;
	// Слой главный: выбран и уже проявился. Звук нужен только ему, чтобы два канала не звучали вместе
	soundAllowed: boolean;
	// Первый кадр пришёл: слой можно проявлять
	onReady: () => void;
	// Слой проявился до конца
	onShown?: () => void;
	// Поток не загрузился или оборвался
	onError: (message: string) => void;
	className?: string;
};

// Слой фона с телеканалом (поток HLS). Стартует без звука, иначе браузер не даст запустить видео;
// звук включается, если посетитель его включил. hls.js грузится отдельным чанком, только когда выбран канал
export function TvLayer({
	wallpaper,
	soundAllowed,
	onReady,
	onShown,
	onError,
	className
}: TvLayerProps) {
	const { url } = wallpaper;
	const videoRef = useRef<HTMLVideoElement>(null);
	const reducedMotion = useMediaQuery(mediaQueries.reducedMotion);
	const { paused, soundOn } = useTvPlayback();
	const duck = useDuckLevel();
	const unlocked = useUserActivation();

	// Колбэки приходят заново при каждой отрисовке; поток создаём один раз и берём из ссылки свежие
	const callbacks = useRef({ onReady, onError });
	useEffect(() => {
		callbacks.current = { onReady, onError };
	});

	// Канал стоит на паузе, если её нажали, вкладка скрыта и канал без звука или включено «уменьшить движение» (тогда первый кадр)
	const syncPlayback = useCallback(() => {
		const video = videoRef.current;
		if (!video) return;
		const audible = wantsSound({ soundOn, unlocked, active: soundAllowed });
		if (shouldPause({ paused, hidden: document.hidden, audible, reducedMotion })) video.pause();
		// play() у muted-видео браузеры разрешают без клика, но промис может отклониться — тогда остаётся кадр
		else video.play().catch(() => {});
	}, [paused, reducedMotion, soundOn, unlocked, soundAllowed]);

	// Свежая синхронизация для потока, который создаётся один раз
	const syncRef = useRef(syncPlayback);
	useEffect(() => {
		syncRef.current = syncPlayback;
		syncPlayback();
		document.addEventListener('visibilitychange', syncPlayback);
		return () => document.removeEventListener('visibilitychange', syncPlayback);
	}, [syncPlayback]);

	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;
		const target = audioTarget({ soundOn, unlocked, active: soundAllowed, duck });
		video.muted = target.muted;
		if (!target.muted) video.volume = target.volume / 100;
	}, [soundOn, unlocked, soundAllowed, duck]);

	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;

		let disposed = false;
		let stopStream = () => {};
		let ready = false;

		const timeout = setTimeout(() => {
			if (!ready) callbacks.current.onError(tvErrors.timeout);
		}, tvStartTimeoutMs);

		function fail(message: string) {
			if (disposed) return;
			callbacks.current.onError(message);
		}

		function onLoadedData() {
			ready = true;
			clearTimeout(timeout);
			syncRef.current();
			callbacks.current.onReady();
		}
		video.addEventListener('loadeddata', onLoadedData);
		video.addEventListener('error', () => fail(tvErrors.unavailable));

		if (video.canPlayType('application/vnd.apple.mpegurl')) {
			// Safari играет HLS сам, hls.js не нужен
			video.src = url;
			stopStream = () => {
				video.removeAttribute('src');
				video.load();
			};
		} else {
			import('hls.js').then(
				({ default: Hls }) => {
					if (disposed) return;
					if (!Hls.isSupported()) {
						fail(tvErrors.unsupported);
						return;
					}
					const hls = new Hls();
					hls.on(Hls.Events.ERROR, (_event, data) => {
						if (data.fatal) fail(tvErrors.unavailable);
					});
					hls.loadSource(url);
					hls.attachMedia(video);
					stopStream = () => hls.destroy();
				},
				// Чанк hls.js не загрузился: скорее всего, нет сети
				() => fail(tvErrors.unavailable)
			);
		}

		return () => {
			disposed = true;
			clearTimeout(timeout);
			video.removeEventListener('loadeddata', onLoadedData);
			stopStream();
		};
	}, [url]);

	return (
		<video
			ref={videoRef}
			muted
			playsInline
			preload="auto"
			aria-label={wallpaper.title}
			onAnimationEnd={onShown}
			className={cn('absolute inset-0 h-full w-full object-cover', className)}
		/>
	);
}
