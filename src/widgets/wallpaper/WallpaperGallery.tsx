import { Play, Plus, X } from 'lucide-react';
import { type DragEvent, useEffect, useRef, useState } from 'react';

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

import { customAccept, maxCustomWallpapers } from './custom';
import {
	addCustomWallpaper,
	loadCustomWallpapers,
	removeCustomWallpaper,
	useCustomWallpapers
} from './useCustomWallpapers';
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
	const custom = useCustomWallpapers();
	const inputRef = useRef<HTMLInputElement>(null);
	const [message, setMessage] = useState<string>();
	const [dragging, setDragging] = useState(false);

	useEffect(() => {
		void loadCustomWallpapers();
	}, []);

	async function upload(file: File | undefined) {
		if (!file) return;
		const result = await addCustomWallpaper(file);
		if (!result.ok) {
			setMessage(result.message);
			return;
		}
		setMessage(
			result.saved
				? undefined
				: 'Браузер не даёт сохранить файл: обои останутся до перезагрузки страницы'
		);
		wallpaper.select(result.id);
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		setDragging(false);
		void upload(event.dataTransfer.files[0]);
	}

	return (
		<Widget
			aria-label="Обои"
			onDragOver={(event) => {
				if (!event.dataTransfer.types.includes('Files')) return;
				event.preventDefault();
				setDragging(true);
			}}
			onDragLeave={(event) => {
				if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
			}}
			onDrop={handleDrop}
			className={cn('flex flex-col overflow-hidden', dragging && 'ring-2 ring-white/60', className)}
		>
			<div className="px-4 pt-4">
				<WidgetHeader title="Обои" />
			</div>

			<div className="flex flex-wrap gap-1.5 px-4 pt-3">
				<CategoryButton onClick={() => scrollTo('custom')}>Мои</CategoryButton>
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
				<section ref={sectionRef('custom')} aria-label="Мои обои">
					<h3 className={sectionTitleClass}>Мои</h3>
					<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
						<button
							type="button"
							onClick={() => inputRef.current?.click()}
							disabled={custom.items.length >= maxCustomWallpapers}
							title="Картинка или видео с вашего устройства. Файл остаётся в браузере и никуда не отправляется"
							className={cn(
								tileClass,
								'flex flex-col items-center justify-center gap-1 border-dashed text-xs text-white/70 hover:text-white disabled:opacity-50'
							)}
						>
							<Plus className="size-5" />
							Загрузить своё
						</button>
						{custom.items.map(({ wallpaper: item, saved }) => {
							const active = item.id === wallpaper.current.id;
							return (
								<div key={item.id} className="group/custom relative">
									<button
										type="button"
										onClick={() => wallpaper.select(item.id)}
										aria-pressed={active}
										title={saved ? item.title : `${item.title} (до перезагрузки страницы)`}
										className={cn(tileClass, 'block w-full', active && tileActiveClass)}
									>
										{item.media === 'image' ? (
											<img
												src={item.url}
												alt=""
												loading="lazy"
												decoding="async"
												className="h-full w-full object-cover"
											/>
										) : (
											// Первый кадр: хватает метаданных, всё видео в плитке не грузится
											<video
												src={`${item.url}#t=0.1`}
												preload="metadata"
												muted
												playsInline
												className="h-full w-full object-cover"
											/>
										)}
										<span className={tileCaptionClass}>{item.title}</span>
										{item.media === 'video' && (
											<span
												className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-black/60"
												title="Живые обои"
											>
												<Play className="size-2.5 fill-current" />
											</span>
										)}
									</button>
									<button
										type="button"
										onClick={() => removeCustomWallpaper(item.id)}
										aria-label={`Удалить «${item.title}»`}
										title="Удалить"
										className="absolute top-1.5 left-1.5 flex size-5 items-center justify-center rounded-full bg-black/60 text-white/80 opacity-0 outline-none group-hover/custom:opacity-100 hover:bg-black/80 hover:text-white focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-white/40 [@media(hover:none)]:opacity-100"
									>
										<X className="size-3" />
									</button>
								</div>
							);
						})}
					</div>
					<p className="pt-2 text-[0.7rem] text-white/50">
						Файл можно перетащить сюда. Он хранится только в вашем браузере.
					</p>
					{message && (
						<p role="alert" className="pt-1 text-[0.7rem] text-red-300">
							{message}
						</p>
					)}
					<input
						ref={inputRef}
						type="file"
						accept={customAccept}
						hidden
						onChange={(event) => {
							void upload(event.target.files?.[0]);
							// Тот же файл можно выбрать снова
							event.target.value = '';
						}}
					/>
				</section>
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
												srcSet={item.thumbSrcSet}
												// Плитка ~9rem с sm, на телефоне две колонки на всю ширину окна
												sizes="(min-width: 40rem) 9rem, calc((100vw - 4rem) / 2)"
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
