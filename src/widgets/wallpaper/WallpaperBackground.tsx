import { useEffect, useRef, useState } from 'react';

import { useMediaQuery } from '@/hooks/useMediaQuery';
import { mediaQueries } from '@/lib/media';
import { cn } from '@/lib/utils';

import { RutubeLayer } from '@/widgets/rutube/RutubeLayer';
import { setYouTubeTitle } from '@/widgets/youtube/useYouTubeHistory';
import { YouTubeLayer } from '@/widgets/youtube/YouTubeLayer';

import { defaultWallpaperId, useWallpaper } from './useWallpaper';
import { videoPortraitMedia } from './variants';
import type { CustomWallpaper, FileWallpaper, Wallpaper } from './wallpapers';

const layerClass = 'absolute inset-0 h-full w-full object-cover';

type LayerProps = {
	wallpaper: FileWallpaper | CustomWallpaper;
	onReady: () => void;
	// Слой проявился до конца
	onShown?: () => void;
	className?: string;
};

function Layer({ wallpaper, onReady, onShown, className }: LayerProps) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const reducedMotion = useMediaQuery(mediaQueries.reducedMotion);
	// Узкий портретный экран получает кроп видео 540×960 (если он есть). Выбираем здесь, а не атрибутом media у <source>:
	// браузер без его поддержки взял бы первый же источник, то есть кроп и на десктопе
	const narrow = useMediaQuery(videoPortraitMedia);
	const video = wallpaper.kind === 'custom' ? undefined : wallpaper.video;
	const sources = video
		? narrow
			? [...video.portraitSources, ...video.sources]
			: video.sources
		: [];

	// Видео играет, только пока вкладка видна: в фоне оно зря грузит процессор.
	// При «уменьшить движение» в системе видео стоит на первом кадре
	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;

		function sync() {
			if (!video) return;
			if (reducedMotion || document.hidden) video.pause();
			// play() у muted-видео браузеры разрешают без клика, но промис может отклониться — тогда остаётся кадр
			else
				video.play().catch(() => {
					// iOS в режиме экономии заряда отклоняет play(), и loadeddata может не прийти.
					// Если есть превью, считаем слой готовым: иначе смена обоев зависла бы
					if (video.poster) onReady();
				});
		}

		sync();
		document.addEventListener('visibilitychange', sync);
		return () => document.removeEventListener('visibilitychange', sync);
		// onReady каждый раз новая функция, но делает одно и то же (setReadyId), поэтому в зависимости её не берём
		// oxlint-disable-next-line react-hooks/exhaustive-deps
	}, [reducedMotion, narrow]);

	const media = wallpaper.kind === 'custom' ? wallpaper.media : wallpaper.kind;
	if (media === 'image') {
		const image = wallpaper.kind === 'custom' ? undefined : wallpaper.image;
		const img = (
			<img
				src={wallpaper.url}
				// Без вариантов (свои обои, новые обои без запуска скрипта) остаётся один файл
				srcSet={image?.srcSet}
				sizes={image?.srcSet ? image.sizes : undefined}
				alt={wallpaper.title}
				// Фон — главная картинка страницы: качаем с высоким приоритетом, а раскодирует браузер вне основного потока
				fetchPriority="high"
				decoding="async"
				onLoad={onReady}
				onAnimationEnd={onShown}
				className={cn(layerClass, className)}
			/>
		);
		if (!image || image.sources.length === 0) return img;
		// Источники по порядку: портретные кропы (AVIF, затем webp), горизонтальный AVIF; запасной webp — сам <img>.
		// <picture> не рисуется сам, поэтому слой остаётся <img> с теми же классами
		return (
			<picture>
				{image.sources.map((source) => (
					<source
						key={`${source.media ?? 'landscape'}-${source.type}`}
						type={source.type}
						media={source.media}
						srcSet={source.srcSet}
						sizes={source.sizes}
					/>
				))}
				{img}
			</picture>
		);
	}

	return (
		<video
			ref={videoRef}
			// Смена набора источников (повернули телефон) пересоздаёт видео: у <source> без этого src не перечитывается
			key={narrow ? 'portrait' : 'landscape'}
			src={sources.length === 0 ? wallpaper.url : undefined}
			poster={wallpaper.kind === 'custom' ? undefined : wallpaper.thumb}
			muted
			loop
			playsInline
			preload="auto"
			aria-label={wallpaper.title}
			onLoadedData={onReady}
			// Запасной сигнал: в iOS loadeddata может не прийти. Отклонённый play() разбирает sync выше
			onCanPlay={onReady}
			onAnimationEnd={onShown}
			className={cn(layerClass, className)}
		>
			{/* AV1 первым, H.264 запасным: браузер берёт первый тип, который умеет декодировать */}
			{sources.map((source) => (
				<source key={source.src} src={source.src} type={source.type} />
			))}
		</video>
	);
}

// Фон на весь экран: картинка, зацикленное видео без звука, видео с YouTube или эфир Rutube.
// Новые обои кладутся поверх старых и проявляются, когда загрузились, — без чёрной вспышки между ними
export function WallpaperBackground() {
	const { current: wallpaper, fail, select } = useWallpaper();
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

	// Видео или эфир не заиграли. Новое откатываем на то, что сейчас видно, а на уже показанном видео
	// (его удалили или закрыли доступ) остаётся вернуться к обоям по умолчанию.
	// Если не загрузился сам плеер (permanent: false), показанные обои не трогаем: превью остаётся на месте
	function handleError(item: Wallpaper, message: string, permanent: boolean) {
		if (item.id !== shown.id) fail(message, shown.id);
		else if (permanent) fail(message, defaultWallpaperId);
	}

	return (
		<>
			{/* key по id: когда новые обои становятся нижним слоем, элемент не пересоздаётся и видео не начинается заново */}
			{layers.map((item) => {
				const incoming = item.id !== shown.id;
				const common = {
					onReady: () => setReadyId(item.id),
					// Анимация, а не transition: если файл уже в кэше и загрузился до первой отрисовки, transition бы не сработал
					className: cn(
						incoming &&
							(readyId === item.id ? 'animate-in duration-700 ease-in-out fade-in' : 'opacity-0')
					),
					onShown: incoming ? () => setShown(item) : undefined
				};
				if (item.kind === 'youtube') {
					return (
						<YouTubeLayer
							key={item.id}
							wallpaper={item}
							// Звучит только главный слой: выбранный и уже проявившийся
							soundAllowed={item.id === wallpaper.id && readyId === item.id}
							onError={(message, permanent) => handleError(item, message, permanent)}
							onTitle={(title) => setYouTubeTitle(item.videoId, title)}
							{...common}
						/>
					);
				}
				if (item.kind === 'rutube') {
					return (
						<RutubeLayer
							key={item.id}
							wallpaper={item}
							// Звучит только главный слой: выбранный и уже проявившийся
							soundAllowed={item.id === wallpaper.id && readyId === item.id}
							onError={(message) => handleError(item, message, true)}
							// Запуск отменён: прежние обои, а если слой и был фоном (после перезагрузки) — обои по умолчанию
							onCancel={() => select(item.id !== shown.id ? shown.id : defaultWallpaperId)}
							{...common}
						/>
					);
				}
				return <Layer key={item.id} wallpaper={item} {...common} />;
			})}
		</>
	);
}
