import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { cn } from '@/lib/utils';

import type { Wallpaper } from './wallpapers';

const reducedMotionQuery = '(prefers-reduced-motion: reduce)';

function subscribeReducedMotion(listener: () => void) {
	const media = window.matchMedia(reducedMotionQuery);
	media.addEventListener('change', listener);
	return () => media.removeEventListener('change', listener);
}

function prefersReducedMotion() {
	return window.matchMedia(reducedMotionQuery).matches;
}

const layerClass = 'absolute inset-0 h-full w-full object-cover';

type LayerProps = {
	wallpaper: Wallpaper;
	onReady: () => void;
	// Слой проявился до конца
	onShown?: () => void;
	className?: string;
};

function Layer({ wallpaper, onReady, onShown, className }: LayerProps) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const reducedMotion = useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion);

	// Видео играет, только пока вкладка видна: в фоне оно зря грузит процессор.
	// При «уменьшить движение» в системе видео стоит на первом кадре
	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;

		function sync() {
			if (!video) return;
			if (reducedMotion || document.hidden) video.pause();
			// play() у muted-видео браузеры разрешают без клика, но промис может отклониться — тогда остаётся кадр
			else video.play().catch(() => {});
		}

		sync();
		document.addEventListener('visibilitychange', sync);
		return () => document.removeEventListener('visibilitychange', sync);
	}, [reducedMotion]);

	if (wallpaper.kind === 'image') {
		return (
			<img
				src={wallpaper.url}
				alt={wallpaper.title}
				onLoad={onReady}
				onAnimationEnd={onShown}
				className={cn(layerClass, className)}
			/>
		);
	}

	return (
		<video
			ref={videoRef}
			src={wallpaper.url}
			poster={wallpaper.thumb}
			muted
			loop
			playsInline
			preload="auto"
			aria-label={wallpaper.title}
			onLoadedData={onReady}
			onAnimationEnd={onShown}
			className={cn(layerClass, className)}
		/>
	);
}

type WallpaperBackgroundProps = {
	wallpaper: Wallpaper;
};

// Фон на весь экран: картинка или зацикленное видео без звука.
// Новые обои кладутся поверх старых и проявляются, когда загрузились, — без чёрной вспышки между ними
export function WallpaperBackground({ wallpaper }: WallpaperBackgroundProps) {
	// Обои, которые уже полностью видны. Пока новые грузятся, они остаются под ними
	const [shown, setShown] = useState(wallpaper);
	const [readyId, setReadyId] = useState<string | null>(null);
	const [requestedId, setRequestedId] = useState(wallpaper.id);

	// Выбрали другие обои — готовность прошлого выбора больше не в счёт, новый слой начинает с прозрачного
	if (requestedId !== wallpaper.id) {
		setRequestedId(wallpaper.id);
		setReadyId(null);
	}

	const layers = shown.id === wallpaper.id ? [shown] : [shown, wallpaper];

	return (
		<>
			{/* key по id: когда новые обои становятся нижним слоем, элемент не пересоздаётся и видео не начинается заново */}
			{layers.map((item) => {
				const incoming = item.id !== shown.id;
				return (
					<Layer
						key={item.id}
						wallpaper={item}
						onReady={() => setReadyId(item.id)}
						// Анимация, а не transition: если файл уже в кэше и загрузился до первой отрисовки, transition бы не сработал
						className={cn(
							incoming &&
								(readyId === item.id ? 'animate-in duration-700 ease-in-out fade-in' : 'opacity-0')
						)}
						onShown={incoming ? () => setShown(item) : undefined}
					/>
				);
			})}
		</>
	);
}
