import { useRef, useState, type CSSProperties } from 'react';

import { youtubeThumb } from '@/lib/youtube/thumbs';
import { cn } from '@/lib/utils';

import {
	imageVariants,
	isLetterboxed,
	isPlaceholderSize,
	type DiscImage,
	type DiscStyle
} from './collection';
import { useSpin, type SpinParams } from './useSpin';

type DiscImageLayerProps = {
	videoId: string;
	image: DiscImage;
	// Мини-пластинка: огромная maxresdefault ни к чему
	small: boolean;
	className?: string;
};

// Картинка пластинки, обрезанная под круг родителем. Берёт первый вариант из цепочки, который загрузился:
// maxresdefault бывает заглушкой 120x90 (она «загружается» без ошибки, поэтому смотрим на размер)
function DiscImageLayer({ videoId, image, small, className }: DiscImageLayerProps) {
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
			// У hqdefault и кадров на картинке чёрные полосы сверху и снизу: чуть увеличиваем, чтобы они ушли за круг
			className={cn(
				'absolute inset-0 h-full w-full object-cover',
				isLetterboxed(variant) && 'scale-[1.34]',
				className
			)}
		/>
	);
}

// Отверстие в центре
function Hole({ size = '4%' }: { size?: string }) {
	return (
		<span
			aria-hidden
			style={{ width: size, height: size }}
			className="absolute top-1/2 left-1/2 -translate-1/2 rounded-full bg-black shadow-[inset_0_0_2px_rgba(255,255,255,0.35)]"
		/>
	);
}

// Прозрачное кольцо в середине компакт-диска: от центра до 19 % радиуса пластика нет
const cdClearMask: CSSProperties = {
	maskImage: 'radial-gradient(circle closest-side, transparent 0 19%, #000 19.5%)'
};

type DiscProps = {
	style: DiscStyle;
	// Нет видео — пустая пластинка без картинки
	videoId?: string;
	image?: DiscImage;
	// Крутить (разгон и торможение сами). Без него пластинка стоит
	spin?: SpinParams;
	// Мини-пластинка в коллекции
	small?: boolean;
	className?: string;
};

// Пластинка в трёх видах. Размер задаёт родитель через className (ширина), высота равна ширине.
// Вращается только слой с картинкой и бороздками; блик лежит сверху и стоит на месте, как свет над диском
export function Disc({
	style,
	videoId,
	image = 'cover',
	spin,
	small = false,
	className
}: DiscProps) {
	const spinRef = useRef<HTMLDivElement>(null);
	useSpin(spinRef, spin);

	// При смене видео или картинки цепочка вариантов начинается заново
	const imageKey = `${videoId ?? ''}/${image}`;
	const layer = videoId ? (
		<DiscImageLayer key={imageKey} videoId={videoId} image={image} small={small} />
	) : null;

	return (
		<div
			className={cn(
				'relative aspect-square w-full rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.6)]',
				className
			)}
		>
			<div
				ref={spinRef}
				className={cn(
					'absolute inset-0 overflow-hidden rounded-full',
					style === 'label' && 'bg-neutral-200',
					style === 'vinyl' && 'bg-neutral-950'
				)}
				style={
					style === 'vinyl'
						? {
								backgroundImage:
									'repeating-radial-gradient(circle at center, #0b0b0b 0 1px, #1b1b1b 1px 2px)'
							}
						: style === 'cd'
							? {
									backgroundImage:
										'conic-gradient(from 30deg, #e5e7eb, #9ca3af, #f3f4f6, #6b7280, #e5e7eb, #9ca3af, #f3f4f6, #e5e7eb)',
									...cdClearMask
								}
							: undefined
				}
			>
				{style === 'label' && (
					<>
						{layer}
						{/* Тонкое кольцо вокруг зоны этикетки */}
						<span
							aria-hidden
							className="absolute inset-[33%] rounded-full border border-black/30 shadow-[0_0_0_1px_rgba(255,255,255,0.25)]"
						/>
						<Hole />
					</>
				)}

				{style === 'vinyl' && (
					<>
						{/* Этикетка в центре: 38 % диаметра */}
						<span className="absolute inset-[31%] overflow-hidden rounded-full bg-neutral-700 shadow-[0_0_0_2px_rgba(0,0,0,0.6)]">
							{layer}
						</span>
						<Hole size="3.5%" />
					</>
				)}

				{style === 'cd' && (
					<>
						<span className="absolute inset-0" style={cdClearMask}>
							{layer}
						</span>
						{/* Кромка прозрачного кольца */}
						<span
							aria-hidden
							className="absolute inset-[31%] rounded-full border border-white/40 shadow-[0_0_0_3px_rgba(255,255,255,0.08)]"
						/>
						<span
							aria-hidden
							className="absolute inset-[44%] rounded-full border border-white/30 bg-black/20"
						/>
					</>
				)}
			</div>

			{/* Блик и кромка не крутятся */}
			<span
				aria-hidden
				className="pointer-events-none absolute inset-0 rounded-full"
				style={{
					backgroundImage:
						style === 'vinyl'
							? 'conic-gradient(from 20deg, transparent 0 8%, rgba(255,255,255,0.2) 13%, transparent 19% 50%, rgba(255,255,255,0.2) 63%, transparent 69%)'
							: style === 'cd'
								? 'conic-gradient(from 0deg, rgba(255,0,128,0.28), rgba(255,200,0,0.22), rgba(0,255,200,0.28), rgba(80,120,255,0.3), rgba(255,0,128,0.28))'
								: 'linear-gradient(135deg, rgba(255,255,255,0.22), transparent 40%, rgba(0,0,0,0.18))',
					...(style === 'cd' ? cdClearMask : undefined),
					boxShadow:
						style === 'label'
							? 'inset 0 0 0 1px rgba(255,255,255,0.45), inset 0 0 12px rgba(0,0,0,0.25)'
							: 'inset 0 0 0 1px rgba(255,255,255,0.2)'
				}}
			/>
		</div>
	);
}
