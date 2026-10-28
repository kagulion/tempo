import { useState } from 'react';

import { youtubeThumb } from '@/lib/youtube/thumbs';
import { cn } from '@/lib/utils';

import { imageVariants, isLetterboxed, isPlaceholderSize, type DiscImage } from './collection';

type DiscImageLayerProps = {
	videoId: string;
	image: DiscImage;
	// Маленькая картинка (мини-упаковка в коллекции): огромная maxresdefault ни к чему
	small: boolean;
	className?: string;
};

// Картинка пластинки или упаковки, обрезанная под форму родителем. Берёт первый вариант из цепочки, который загрузился:
// maxresdefault бывает заглушкой 120x90 (она «загружается» без ошибки, поэтому смотрим на размер).
// Родитель должен ставить key={`${videoId}/${image}`}: при смене видео или картинки цепочка начинается заново
export function DiscImageLayer({ videoId, image, small, className }: DiscImageLayerProps) {
	const variants = imageVariants(image).filter((item) => !small || item !== 'maxresdefault');
	// Сколько вариантов уже не подошло
	const [failed, setFailed] = useState(0);
	const variant = variants[failed];
	if (variant === undefined) return null;

	return (
		<img
			key={variant}
			src={youtubeThumb(videoId, variant)}
			alt=""
			draggable={false}
			loading={small ? 'lazy' : undefined}
			onError={() => setFailed((count) => count + 1)}
			onLoad={(event) => {
				if (isPlaceholderSize(variant, event.currentTarget.naturalWidth)) {
					setFailed((count) => count + 1);
				}
			}}
			// У hqdefault и кадров на картинке чёрные полосы сверху и снизу: чуть увеличиваем, чтобы они ушли за край формы
			className={cn(
				'absolute inset-0 h-full w-full object-cover',
				isLetterboxed(variant) && 'scale-[1.34]',
				className
			)}
		/>
	);
}
