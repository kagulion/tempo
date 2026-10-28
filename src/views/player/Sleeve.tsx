import { cn } from '@/lib/utils';

import type { DiscImage, DiscStyle } from './collection';
import { DiscImageLayer } from './DiscImageLayer';

type SleeveProps = {
	style: DiscStyle;
	videoId: string;
	image: DiscImage;
	className?: string;
};

// Упаковка пластинки в трёх видах, без анимации: конверт для винила, «коробочка» для CD, белый бумажный конверт.
// Размер задаёт родитель через className (ширина), высота равна ширине. Картинка всегда мелкая, как у мини-пластинки
export function Sleeve({ style, videoId, image, className }: SleeveProps) {
	// При смене видео или картинки цепочка вариантов начинается заново
	const layer = (
		<DiscImageLayer key={`${videoId}/${image}`} videoId={videoId} image={image} small />
	);

	return (
		// isolate: слои с z-10 внутри не должны перекрывать соседей, например кнопку меню на плитке
		<div className={cn('relative isolate aspect-square w-full', className)}>
			{style === 'vinyl' && (
				<>
					{/* Краешек чёрной пластинки выглядывает справа из-под конверта */}
					<span
						aria-hidden
						className="absolute top-[3%] right-0 bottom-[3%] w-[28%] rounded-r-full shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
						style={{
							backgroundImage:
								'repeating-radial-gradient(circle at 0% 50%, #0b0b0b 0 1px, #1f1f1f 1px 2px)'
						}}
					/>
					{/* Бумажный конверт с напечатанной картинкой */}
					<span className="absolute top-0 bottom-0 left-0 w-[88%] overflow-hidden rounded-[3px] bg-neutral-300 shadow-[0_3px_8px_rgba(0,0,0,0.55)]">
						{layer}
						<span
							aria-hidden
							className="absolute inset-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25),inset_0_0_10px_rgba(0,0,0,0.3)]"
						/>
					</span>
				</>
			)}

			{style === 'cd' && (
				<span className="absolute inset-0 overflow-hidden rounded-[3px] bg-neutral-900 shadow-[0_3px_8px_rgba(0,0,0,0.55)]">
					{/* Тёмная полоса петель слева */}
					<span
						aria-hidden
						className="absolute top-0 bottom-0 left-0 z-10 w-[9%] bg-linear-to-r from-black via-neutral-800 to-neutral-900"
					/>
					<span className="absolute inset-y-[3%] right-[3%] left-[12%] overflow-hidden">
						{layer}
					</span>
					{/* Блик на пластике */}
					<span
						aria-hidden
						className="absolute inset-0 z-10"
						style={{
							backgroundImage:
								'linear-gradient(115deg, rgba(255,255,255,0.35), rgba(255,255,255,0.05) 35%, transparent 50%, rgba(255,255,255,0.12) 70%, transparent)'
						}}
					/>
					{/* Светлая кромка */}
					<span
						aria-hidden
						className="absolute inset-0 z-10 rounded-[3px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.55),inset_0_0_6px_rgba(255,255,255,0.2)]"
					/>
				</span>
			)}

			{style === 'label' && (
				<span className="absolute inset-0 overflow-hidden rounded-[3px] bg-neutral-100 shadow-[0_3px_8px_rgba(0,0,0,0.55)]">
					{/* Круглое окно в конверте: картинка видна в нём, как этикетка */}
					<span className="absolute inset-[18%] overflow-hidden rounded-full bg-neutral-700 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.35),0_0_0_2px_rgba(0,0,0,0.12)]">
						{layer}
					</span>
					<span
						aria-hidden
						className="absolute inset-0 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12),inset_0_0_8px_rgba(0,0,0,0.12)]"
					/>
				</span>
			)}
		</div>
	);
}
