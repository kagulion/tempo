import { Play, Plus, X } from 'lucide-react';
import { type FormEvent, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Widget, WidgetHeader } from '@/widgets/Widget';

import { defaultWallpaperId, useWallpaper } from './useWallpaper';
import { addYouTubeVideo, removeYouTubeVideo, useYouTubeHistory } from './useYouTubeHistory';
import { categories, wallpapers, youtubeWallpaper } from './wallpapers';
import { parseYouTubeUrl, youtubeWallpaperId } from './youtube';
import { YouTubeControls } from './YouTubeControls';

type WallpaperGalleryProps = {
	className?: string;
};

// Раздел с видео посетителя не входит в categories: он есть не всегда и лежит выше остальных
const youtubeSection = 'youtube';

const tileClass =
	'relative aspect-video overflow-hidden rounded-lg border border-white/15 bg-white/10 outline-none ring-white/20 transition hover:border-white/50 focus-visible:ring-3';

// Окно выбора обоев: превью по категориям в прокручиваемой сетке. Клик по превью сразу меняет фон, окно остаётся открытым.
// Сверху можно вставить ссылку на YouTube: видео станет фоном и попадёт в «Мои видео»
export function WallpaperGallery({ className }: WallpaperGalleryProps) {
	const wallpaper = useWallpaper();
	const history = useYouTubeHistory();
	const scrollRef = useRef<HTMLDivElement>(null);
	const sectionRefs = useRef<Record<string, HTMLElement | undefined>>({});
	const [link, setLink] = useState('');
	const [linkError, setLinkError] = useState<string>();

	// Прокручиваем только сетку: scrollIntoView сдвинул бы и страницу с overflow-hidden
	function scrollTo(section: string) {
		scrollRef.current?.scrollTo({
			top: sectionRefs.current[section]?.offsetTop ?? 0,
			behavior: 'smooth'
		});
	}

	function submit(event: FormEvent) {
		event.preventDefault();
		const video = parseYouTubeUrl(link);
		if (!video) {
			wallpaper.clearError();
			setLinkError('Не похоже на ссылку на видео YouTube');
			return;
		}
		addYouTubeVideo(video);
		wallpaper.select(youtubeWallpaperId(video.videoId));
		setLink('');
		setLinkError(undefined);
	}

	function remove(videoId: string) {
		// Удалили выбранное видео — возвращаем обои по умолчанию, иначе фон остался бы на видео, которого нет в списке
		if (wallpaper.current.id === youtubeWallpaperId(videoId)) wallpaper.select(defaultWallpaperId);
		removeYouTubeVideo(videoId);
	}

	const message = linkError ?? wallpaper.lastError;

	return (
		<Widget aria-label="Обои" className={cn('flex flex-col overflow-hidden', className)}>
			<div className="px-4 pt-4">
				<WidgetHeader title="Обои">
					{/* Пауза и звук есть только у видео с YouTube */}
					{wallpaper.current.kind === 'youtube' && <YouTubeControls />}
				</WidgetHeader>
			</div>

			<form onSubmit={submit} className="flex flex-col gap-1.5 px-4 pt-3">
				<div className="flex gap-1.5">
					<Input
						variant="glass"
						type="text"
						inputMode="url"
						autoComplete="off"
						spellCheck={false}
						placeholder="Ссылка на YouTube"
						aria-label="Ссылка на YouTube"
						aria-invalid={message !== undefined}
						value={link}
						onChange={(event) => {
							setLink(event.target.value);
							setLinkError(undefined);
							wallpaper.clearError();
						}}
					/>
					<Button type="submit" variant="glass-solid" disabled={link.trim() === ''}>
						<Plus data-icon="inline-start" />
						Добавить
					</Button>
				</div>
				{message && (
					<p role="alert" className="text-xs text-red-300">
						{message}
					</p>
				)}
			</form>

			<div className="flex flex-wrap gap-1.5 px-4 pt-3">
				{history.length > 0 && (
					<CategoryButton onClick={() => scrollTo(youtubeSection)}>Мои видео</CategoryButton>
				)}
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
				{history.length > 0 && (
					<section
						ref={(node) => {
							sectionRefs.current[youtubeSection] = node ?? undefined;
						}}
						aria-label="Мои видео"
					>
						<h3 className="pt-3 pb-2 text-xs font-medium text-white/60">Мои видео</h3>
						<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
							{history.map((entry) => {
								const item = youtubeWallpaper(entry);
								const active = item.id === wallpaper.current.id;
								return (
									// Кнопка выбора и кнопка удаления лежат рядом, а не одна в другой: вложенные кнопки в HTML недопустимы
									<div
										key={item.id}
										className={cn(tileClass, active && 'border-white hover:border-white')}
									>
										<button
											type="button"
											onClick={() => wallpaper.select(item.id)}
											aria-pressed={active}
											title={item.title}
											className="absolute inset-0 outline-none focus-visible:ring-3 focus-visible:ring-white/20"
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
											<span
												className="absolute top-1.5 left-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[0.6rem] leading-none font-medium"
												title="Видео с YouTube"
											>
												YouTube
											</span>
										</button>
										<Button
											type="button"
											variant="glass"
											size="icon-xs"
											onClick={() => remove(entry.videoId)}
											aria-label={`Удалить «${item.title}»`}
											title="Удалить"
											className="absolute top-1 right-1 rounded-full bg-black/60 hover:bg-black/80"
										>
											<X />
										</Button>
									</div>
								);
							})}
						</div>
					</section>
				)}

				{categories.map((category) => (
					<section
						key={category.value}
						ref={(node) => {
							sectionRefs.current[category.value] = node ?? undefined;
						}}
						aria-label={category.label}
					>
						<h3 className="pt-3 pb-2 text-xs font-medium text-white/60">{category.label}</h3>
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
											className={cn(tileClass, active && 'border-white hover:border-white')}
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

function CategoryButton({ onClick, children }: { onClick: () => void; children: string }) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 transition-colors outline-none hover:bg-white/20 hover:text-white focus-visible:ring-3 focus-visible:ring-white/20"
		>
			{children}
		</button>
	);
}
