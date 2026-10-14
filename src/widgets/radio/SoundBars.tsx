import type { CSSProperties } from 'react';

import { cn } from '@/lib/utils';

// Длительность и задержка у каждой полоски свои, чтобы движение не выглядело механическим
const bars = [
	{ duration: '0.9s', delay: '-0.2s' },
	{ duration: '0.7s', delay: '-0.5s' },
	{ duration: '1.1s', delay: '-0.1s' },
	{ duration: '0.8s', delay: '-0.7s' }
];

type SoundBarsProps = {
	// Звук идёт сейчас. Иначе полоски стоят низко
	active: boolean;
	className?: string;
};

// Только CSS-анимация: AnalyserNode для потоков станций не годится — они с чужих доменов,
// без CORS анализатор даёт тишину, а crossOrigin ломает воспроизведение
export function SoundBars({ active, className }: SoundBarsProps) {
	return (
		<div aria-hidden className={cn('flex h-4 items-center gap-0.5', className)}>
			{bars.map((bar, index) => (
				<span
					key={index}
					// Без анимации (reduced motion) полоски просто стоят низко
					className="h-full w-0.5 origin-center scale-y-25 animate-[sound-bar_var(--bar-duration)_ease-in-out_var(--bar-delay)_infinite] rounded-full bg-white/80 motion-reduce:animate-none"
					style={
						{
							'--bar-duration': bar.duration,
							'--bar-delay': bar.delay,
							animationPlayState: active ? 'running' : 'paused'
						} as CSSProperties
					}
				/>
			))}
		</div>
	);
}
