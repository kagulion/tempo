import { Play } from 'lucide-react';
import { useRef } from 'react';

import { cn } from '@/lib/utils';
import { Widget } from '@/widgets/Widget';

import { type Category, categories, wallpapers } from './wallpapers';

type WallpaperGalleryProps = {
	currentId: string;
	onSelect: (id: string) => void;
	className?: string;
};

// Окно выбора обоев: превью по категориям в прокручиваемой сетке. Клик по превью сразу меняет фон, окно остаётся открытым
export function WallpaperGallery({ currentId, onSelect, className }: WallpaperGalleryProps) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const sectionRefs = useRef<Partial<Record<Category, HTMLElement>>>({});

	// Прокручиваем только сетку: scrollIntoView сдвинул бы и страницу с overflow-hidden
	function scrollTo(category: Category) {
		const section = sectionRefs.current[category];
		scrollRef.current?.scrollTo({ top: section?.offsetTop ?? 0, behavior: 'smooth' });
	}

	return (
		<Widget aria-label="Обои" className={cn('flex flex-col overflow-hidden', className)}>
			<span className="px-4 pt-4 text-xs font-medium text-white/60">Обои</span>

			<div className="flex flex-wrap gap-1.5 px-4 pt-3">
				{categories.map((category) => (
					<button
						key={category.value}
						type="button"
						onClick={() => scrollTo(category.value)}
						className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 transition-colors outline-none hover:bg-white/20 hover:text-white focus-visible:ring-3 focus-visible:ring-white/20"
					>
						{category.label}
					</button>
				))}
			</div>

			<div
				ref={scrollRef}
				className="relative min-h-0 flex-1 [scrollbar-width:thin] [scrollbar-color:rgb(255_255_255/0.2)_transparent] overflow-y-auto px-4 pb-4"
			>
				{categories.map((category) => (
					<section
						key={category.value}
						ref={(node) => {
							if (node) sectionRefs.current[category.value] = node;
						}}
						aria-label={category.label}
					>
						<h3 className="pt-3 pb-2 text-xs font-medium text-white/60">{category.label}</h3>
						<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
							{wallpapers
								.filter((item) => item.category === category.value)
								.map((item) => {
									const active = item.id === currentId;
									return (
										<button
											key={item.id}
											type="button"
											onClick={() => onSelect(item.id)}
											aria-pressed={active}
											title={item.title}
											className={cn(
												'relative aspect-video overflow-hidden rounded-lg border border-white/15 bg-white/10 outline-none',
												'ring-white/20 transition hover:border-white/50 focus-visible:ring-3',
												active && 'border-white hover:border-white'
											)}
										>
											{/* lazy: пока окно скрыто, превью не грузятся */}
											<img
												src={item.thumb}
												alt=""
												loading="lazy"
												decoding="async"
												className="h-full w-full object-cover"
											/>
											<span className="absolute inset-x-0 bottom-0 truncate bg-linear-to-t from-black/80 to-transparent px-2 pt-4 pb-1 text-left text-[0.7rem] font-medium">
												{item.title}
											</span>
											{item.kind === 'video' && (
												<span
													className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-black/60"
													title="Живые обои"
												>
													<Play className="size-2.5 fill-current" />
												</span>
											)}
										</button>
									);
								})}
						</div>
					</section>
				))}
			</div>
		</Widget>
	);
}
