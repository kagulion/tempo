import { useRef } from 'react';

import { mediaQueries } from '@/lib/media';
import { cn } from '@/lib/utils';

// Общее для окон-галерей (обои, YouTube, ТВ): плитки, кнопки-переходы по секциям и прокрутка к секции

export const tileClass =
	'relative aspect-video overflow-hidden rounded-lg border border-white/15 bg-white/10 outline-none ring-white/20 transition hover:border-white/50 focus-visible:ring-3 group-focus-visible:ring-3 group-focus-visible:ring-white';

export const tileActiveClass = 'border-white hover:border-white';

export const tileCaptionClass =
	'absolute inset-x-0 bottom-0 truncate bg-linear-to-t from-black/80 to-transparent px-2 pt-4 pb-1 text-left text-[0.7rem] font-medium';

export const sectionTitleClass = 'pt-3 pb-2 text-xs font-medium text-white/60';

// Прокручиваем только список: scrollIntoView сдвинул бы и страницу с overflow-hidden
export function useSectionScroll() {
	const scrollRef = useRef<HTMLDivElement>(null);
	const sectionRefs = useRef<Record<string, HTMLElement | undefined>>({});

	return {
		scrollRef,
		sectionRef: (section: string) => (node: HTMLElement | null) => {
			sectionRefs.current[section] = node ?? undefined;
		},
		scrollTo: (section: string) => {
			scrollRef.current?.scrollTo({
				top: sectionRefs.current[section]?.offsetTop ?? 0,
				// При «уменьшить движение» прокручиваем сразу, без анимации
				behavior: window.matchMedia(mediaQueries.reducedMotion).matches ? 'auto' : 'smooth'
			});
		}
	};
}

export function CategoryButton({ onClick, children }: { onClick: () => void; children: string }) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				'rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 transition-colors outline-none',
				'hover:bg-white/20 hover:text-white focus-visible:ring-3 focus-visible:ring-white/20'
			)}
		>
			{children}
		</button>
	);
}
