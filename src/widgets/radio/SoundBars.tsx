import { useEffect, useRef, useState, type CSSProperties } from 'react';

import { useMediaQuery } from '@/hooks/useMediaQuery';
import { mediaQueries } from '@/lib/media';
import { cn } from '@/lib/utils';

import { subscribeLevels } from './audioAnalyser';

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

// Эквалайзер. Полоски идут по настоящему спектру радио (audioAnalyser.ts: потоки Рекорда отдают CORS).
// Если анализатор недоступен (контекст ещё не разблокирован, поток молчит, Web Audio нет),
// двигаются на CSS-анимации. Уровни пишем прямо в стиль, без перерисовок React.
// Цикл кадров идёт, только пока звук слышен, а полоски видны; при reduced motion они стоят
export function SoundBars({ active, className }: SoundBarsProps) {
	const ref = useRef<HTMLDivElement>(null);
	const reducedMotion = useMediaQuery(mediaQueries.reducedMotion);
	// Скрытое окно (hidden) не пересекается с экраном — цикл кадров для него не нужен
	const [visible, setVisible] = useState(true);
	// Приходят ли настоящие уровни
	const [live, setLive] = useState(false);

	useEffect(() => {
		const node = ref.current;
		if (!node || typeof IntersectionObserver === 'undefined') return;
		const observer = new IntersectionObserver((entries) => {
			const last = entries[entries.length - 1];
			if (last) setVisible(last.isIntersecting);
		});
		observer.observe(node);
		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		const node = ref.current;
		if (!node || !active || !visible || reducedMotion) return;
		const unsubscribe = subscribeLevels((levels) => {
			setLive(levels !== null);
			if (!levels) return;
			levels.forEach((level, index) => {
				const bar = node.children[index];
				if (bar instanceof HTMLElement) bar.style.transform = `scaleY(${level})`;
			});
		});
		return () => {
			unsubscribe();
			setLive(false);
			for (const bar of node.children) {
				if (bar instanceof HTMLElement) bar.style.transform = '';
			}
		};
	}, [active, visible, reducedMotion]);

	const showLevels = live && active && visible && !reducedMotion;

	return (
		<div ref={ref} aria-hidden className={cn('flex h-4 items-center gap-0.5', className)}>
			{bars.map((bar, index) => (
				<span
					key={index}
					className={cn(
						'h-full w-0.5 origin-center rounded-full bg-white/80',
						showLevels
							? 'transition-transform duration-100 ease-out'
							: // Без анимации (reduced motion) полоски просто стоят низко
								'scale-y-25 animate-[sound-bar_var(--bar-duration)_ease-in-out_var(--bar-delay)_infinite] motion-reduce:animate-none'
					)}
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
