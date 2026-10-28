import { useEffect, useRef, useState } from 'react';

import { youtubeThumb } from '@/lib/youtube/thumbs';

import { previewVariant, type DiscImage } from './collection';

type Layer = { key: number; src: string };

type BackgroundProps = {
	videoId?: string;
	image?: DiscImage;
};

// Фон страницы: картинка текущей пластинки, сильно размытая и затемнённая. Новая картинка проявляется
// поверх прежней, поэтому смена пластинки идёт плавно. Размытие на сильно увеличенной картинке, чтобы края не светились
export function Background({ videoId, image = 'cover' }: BackgroundProps) {
	const [layers, setLayers] = useState<Layer[]>([]);
	const counter = useRef(0);
	const src = videoId ? youtubeThumb(videoId, previewVariant(image)) : undefined;

	useEffect(() => {
		if (!src) return;
		counter.current += 1;
		const key = counter.current;
		// Две картинки хватает: новая и та, что под ней
		setLayers((current) => [...current.slice(-1), { key, src }]);
	}, [src]);

	return (
		<div aria-hidden className="absolute inset-0 overflow-hidden bg-neutral-950">
			{layers.map((layer) => (
				<img
					key={layer.key}
					src={layer.src}
					alt=""
					draggable={false}
					// Если у кадра нет крупной версии, берём hqdefault
					onError={(event) => {
						if (videoId && !event.currentTarget.src.endsWith('/hqdefault.jpg')) {
							event.currentTarget.src = youtubeThumb(videoId, 'hqdefault');
						}
					}}
					className="absolute inset-0 h-full w-full scale-125 animate-in object-cover blur-3xl brightness-50 saturate-125 duration-1000 fade-in"
				/>
			))}
			<div className="absolute inset-0 bg-black/30" />
		</div>
	);
}
