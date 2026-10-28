import { Plus, X } from 'lucide-react';
import { type FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
	CategoryButton,
	sectionTitleClass,
	tileActiveClass,
	tileCaptionClass,
	tileClass,
	useSectionScroll
} from '@/widgets/gallery';
import { defaultWallpaperId, useWallpaper } from '@/widgets/wallpaper/useWallpaper';
import { youtubeWallpaper } from '@/widgets/wallpaper/wallpapers';
import { Widget, WidgetHeader } from '@/widgets/Widget';

import { streamCollections, streams } from './streams';
import { addYouTubeVideo, removeYouTubeVideo, useYouTubeHistory } from './useYouTubeHistory';
import { parseYouTubeUrl } from '@/lib/youtube/links';
import { youtubeThumb } from '@/lib/youtube/thumbs';
import { youtubeWallpaperId } from './youtube';
import { YouTubeControls } from './YouTubeControls';

type YouTubeWidgetProps = {
	className?: string;
};

// Подборки без стримов не показываем: пустой заголовок ничего не даёт
const collections = streamCollections.filter((collection) =>
	streams.some((stream) => stream.collection === collection.value)
);

// Раздел с видео посетителя не входит в streamCollections: он есть не всегда и лежит выше остальных
const historySection = 'history';

// Окно YouTube: сверху поле для ссылки, ниже «Мои видео» и подборки стримов. Клик по плитке сразу меняет фон,
// окно остаётся открытым. Вставленная ссылка попадает в «Мои видео», стримы из подборок — нет
export function YouTubeWidget({ className }: YouTubeWidgetProps) {
	const wallpaper = useWallpaper();
	const history = useYouTubeHistory();
	const { scrollRef, sectionRef, scrollTo } = useSectionScroll();
	const [link, setLink] = useState('');
	const [linkError, setLinkError] = useState<string>();

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
		<Widget aria-label="YouTube" className={cn('flex flex-col overflow-hidden', className)}>
			<div className="px-4 pt-4">
				<WidgetHeader title="YouTube">
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
					<CategoryButton onClick={() => scrollTo(historySection)}>Мои видео</CategoryButton>
				)}
				{collections.map((collection) => (
					<CategoryButton key={collection.value} onClick={() => scrollTo(collection.value)}>
						{collection.label}
					</CategoryButton>
				))}
			</div>

			<div
				ref={scrollRef}
				className="relative min-h-0 flex-1 scrollbar-glass overflow-y-auto px-4 pb-4"
			>
				{history.length > 0 && (
					<section ref={sectionRef(historySection)} aria-label="Мои видео">
						<h3 className={sectionTitleClass}>Мои видео</h3>
						<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
							{history.map((entry) => {
								const item = youtubeWallpaper(entry);
								const active = item.id === wallpaper.current.id;
								return (
									// Кнопка выбора и кнопка удаления лежат рядом, а не одна в другой: вложенные кнопки в HTML недопустимы
									<div key={item.id} className={cn(tileClass, active && tileActiveClass)}>
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
											<span className={tileCaptionClass}>{item.title}</span>
										</button>
										<Button
											type="button"
											variant="glass"
											size="icon-xs"
											onClick={() => remove(entry.videoId)}
											aria-label={`Удалить «${item.title}»`}
											hint="Удалить"
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

				{collections.map((collection) => (
					<section
						key={collection.value}
						ref={sectionRef(collection.value)}
						aria-label={collection.label}
					>
						<h3 className={sectionTitleClass}>{collection.label}</h3>
						<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
							{streams
								.filter((stream) => stream.collection === collection.value)
								.map((stream) => {
									const id = youtubeWallpaperId(stream.videoId);
									const active = id === wallpaper.current.id;
									return (
										<button
											key={stream.videoId}
											type="button"
											onClick={() => wallpaper.select(id)}
											aria-pressed={active}
											title={stream.title}
											className={cn(tileClass, active && tileActiveClass)}
										>
											<img
												src={youtubeThumb(stream.videoId)}
												alt=""
												loading="lazy"
												decoding="async"
												className="h-full w-full object-cover"
											/>
											<span className={tileCaptionClass}>{stream.title}</span>
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
