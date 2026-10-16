import { Play } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
	CategoryButton,
	sectionTitleClass,
	tileActiveClass,
	tileCaptionClass,
	tileClass,
	useSectionScroll
} from '@/widgets/gallery';
import { Widget, WidgetHeader } from '@/widgets/Widget';

import { useWallpaper } from './useWallpaper';
import { categories, wallpapers } from './wallpapers';

type WallpaperGalleryProps = {
	className?: string;
};

// Окно выбора обоев: превью по категориям в прокручиваемой сетке. Клик по превью сразу меняет фон, окно остаётся открытым.
// Видео с YouTube и телеканалы выбираются в своих окнах
export function WallpaperGallery({ className }: WallpaperGalleryProps) {
	const wallpaper = useWallpaper();
	const { scrollRef, sectionRef, scrollTo } = useSectionScroll();

	return (
		<Widget aria-label="Обои" className={cn('flex flex-col overflow-hidden', className)}>
			<div className="px-4 pt-4">
				<WidgetHeader title="Обои" />
			</div>

			<div className="flex flex-wrap gap-1.5 px-4 pt-3">
				{categories.map((category) => (
					<CategoryButton key={category.value} onClick={() => scrollTo(category.value)}>
						{category.label}
					</CategoryButton>
				))}
			</div>

			<div
				ref={scrollRef}
				className="relative min-h-0 flex-1 scrollbar-glass overflow-y-auto px-4 pb-4"
			>
				{categories.map((category) => (
					<section
						key={category.value}
						ref={sectionRef(category.value)}
						aria-label={category.label}
					>
						<h3 className={sectionTitleClass}>{category.label}</h3>
						<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
							{wallpapers
								.filter((item) => item.category === category.value)
								.map((item) => {
									const active = item.id === wallpaper.current.id;
									return (
										<button
											key={item.id}
											type="button"
											onClick={() => wallpaper.select(item.id)}
											aria-pressed={active}
											title={item.title}
											className={cn(tileClass, active && tileActiveClass)}
										>
											{/* lazy: пока окно скрыто, превью не грузятся */}
											<img
												src={item.thumb}
												alt=""
												loading="lazy"
												decoding="async"
												className="h-full w-full object-cover"
											/>
											<span className={tileCaptionClass}>{item.title}</span>
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
