import type { Ref } from 'react';

import { cn } from '@/lib/utils';

import type { DiscImage, DiscStyle } from './collection';
import { Disc } from './Disc';
import { DiscImageLayer } from './DiscImageLayer';
import type { SpinParams } from './useSpin';

type DiscStageProps = {
	style: DiscStyle;
	// Нет видео — пустая упаковка и пустая пластинка
	videoId?: string;
	image?: DiscImage;
	spin?: SpinParams;
	// Насколько диск выдвинут из-за упаковки
	reach?: DiscReach;
	// Контейнер для плеера YouTube: он стоит под упаковкой и закрыт ею, «Показать видео» выносит его окошком в угол
	hostRef?: Ref<HTMLDivElement>;
	showVideo?: boolean;
	className?: string;
};

// Сколько диска видно: 20 % диаметра, 30 % при наведении, 60 % когда раздвинули кликом.
// Сцена всегда одной ширины (упаковка и 60 % диска), а упаковка с диском сдвигаются, чтобы то, что видно, стояло по центру.
// Сдвиги в долях собственной ширины: упаковка — доля стороны S, диск — доля своего диаметра 0,84 S
export type DiscReach = 'rest' | 'hover' | 'open';

const sleeveShift: Record<DiscReach, string> = {
	rest: 'translate-x-[16.8%]',
	hover: 'translate-x-[12.6%]',
	open: 'translate-x-0'
};
const discShift: Record<DiscReach, string> = {
	rest: 'translate-x-[59%]',
	hover: 'translate-x-[64%]',
	open: 'translate-x-[79%]'
};

// Пластинка на столе: статичная квадратная упаковка с картинкой, а за ней вращается диск. Родитель задаёт ширину
// и пропорцию 1,504 : 1: упаковка занимает 66,5 % ширины (квадрат во всю высоту), диск — 84 % её стороны.
// Вид упаковки зависит от вида пластинки, как в коллекции: бумажный конверт для винила, «коробочка» со слюдой для CD.
// Все тени лежат на неподвижных слоях: вращается только сам диск внутри Disc. Движение — только translate
// Плавный сдвиг; при уменьшенном движении сразу
const slide =
	'transition-[translate] duration-250 ease-[cubic-bezier(0.77,0,0.175,1)] motion-reduce:transition-none';

export function DiscStage({
	style,
	videoId,
	image = 'cover',
	spin,
	reach = 'rest',
	hostRef,
	showVideo = false,
	className
}: DiscStageProps) {
	// При смене видео или картинки цепочка вариантов начинается заново
	const layer = videoId ? (
		<DiscImageLayer key={`${videoId}/${image}`} videoId={videoId} image={image} small={false} />
	) : null;

	return (
		<div className={cn('relative size-full', className)}>
			<Disc
				style={style}
				videoId={videoId}
				image={image}
				spin={spin}
				className={cn(
					slide,
					discShift[reach],
					'absolute top-[8%] left-0 w-[55.85%] shadow-[0_6px_20px_rgba(0,0,0,0.5)]'
				)}
			/>

			<div className={cn(slide, sleeveShift[reach], 'absolute top-0 left-0 aspect-square h-full')}>
				{/* Плеер YouTube нельзя прятать совсем: он стоит по центру упаковки и закрыт ею (она непрозрачная) */}
				<div
					ref={hostRef}
					className={cn(
						'absolute size-[200px] [&_iframe]:size-full',
						showVideo
							? '-top-3 -right-3 z-30 overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/20'
							: 'top-1/2 left-1/2 z-0 -translate-1/2'
					)}
				/>
				<div className="absolute inset-0 overflow-hidden rounded-[3px] bg-neutral-900 shadow-[0_10px_36px_rgba(0,0,0,0.6),6px_0_16px_rgba(0,0,0,0.4)]">
					{style === 'vinyl' ? (
						<>
							{layer}
							{/* Кромка и лёгкий блик на бумаге */}
							<span
								aria-hidden
								className="absolute inset-0"
								style={{
									backgroundImage:
										'linear-gradient(135deg, rgba(255,255,255,0.16), transparent 35%, rgba(0,0,0,0.2))',
									boxShadow:
										'inset 0 0 0 1px rgba(255,255,255,0.22), inset 0 0 14px rgba(0,0,0,0.3)'
								}}
							/>
						</>
					) : (
						<>
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
						</>
					)}
				</div>
			</div>
		</div>
	);
}
