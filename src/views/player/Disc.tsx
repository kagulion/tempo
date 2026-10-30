import { useRef, type CSSProperties } from 'react';

import { cn } from '@/lib/utils';

import type { DiscImage, DiscStyle } from './collection';
import { DiscImageLayer } from './DiscImageLayer';
import { useSpin, type SpinParams } from './useSpin';

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
	className?: string;
};

// Пластинка в двух видах. Размер задаёт родитель через className (ширина), высота равна ширине.
// Вращается только слой с картинкой и бороздками; блик лежит сверху и стоит на месте, как свет над диском
export function Disc({ style, videoId, image = 'cover', spin, className }: DiscProps) {
	const spinRef = useRef<HTMLDivElement>(null);
	useSpin(spinRef, spin, style);

	// При смене видео или картинки цепочка вариантов начинается заново
	const imageKey = `${videoId ?? ''}/${image}`;
	const layer = videoId ? (
		<DiscImageLayer key={imageKey} videoId={videoId} image={image} small={false} />
	) : null;

	return (
		<div className={cn('relative aspect-square w-full rounded-full', className)}>
			<div
				ref={spinRef}
				className={cn(
					'absolute inset-0 overflow-hidden rounded-full',
					style === 'vinyl' && 'bg-neutral-950'
				)}
				style={
					style === 'vinyl'
						? {
								backgroundImage:
									'repeating-radial-gradient(circle at center, #0b0b0b 0 1px, #1b1b1b 1px 2px)'
							}
						: {
								backgroundImage:
									'conic-gradient(from 30deg, #e5e7eb, #9ca3af, #f3f4f6, #6b7280, #e5e7eb, #9ca3af, #f3f4f6, #e5e7eb)',
								...cdClearMask
							}
				}
			>
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
							: 'conic-gradient(from 0deg, rgba(255,0,128,0.28), rgba(255,200,0,0.22), rgba(0,255,200,0.28), rgba(80,120,255,0.3), rgba(255,0,128,0.28))',
					...(style === 'cd' ? cdClearMask : undefined),
					boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.2)'
				}}
			/>
		</div>
	);
}
