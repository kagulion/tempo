import { Plus } from 'lucide-react';
import { type FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
	CategoryButton,
	sectionTitleClass,
	tileActiveClass,
	tileClass,
	useSectionScroll
} from '@/widgets/gallery';
import { useWallpaper } from '@/widgets/wallpaper/useWallpaper';
import { Widget, WidgetHeader } from '@/widgets/Widget';

import {
	type RutubeStream,
	parseRutubeUrl,
	rutubeErrors,
	rutubeHints,
	rutubeWallpaperId
} from './rutube';
import { RutubeControls } from './RutubeControls';
import { streamsFor, topicsWithStreams } from './streams';
import { markUserSelected, useLaunchState } from './useRutube';

type RutubeWidgetProps = {
	className?: string;
};

// Окно Rutube: сверху поле для ссылки на эфир, ниже ряд тегов тем и список эфиров по темам.
// Клик по карточке сразу меняет фон, окно остаётся открытым.
export function RutubeWidget({ className }: RutubeWidgetProps) {
	const wallpaper = useWallpaper();
	const streamId = wallpaper.current.kind === 'rutube' ? wallpaper.current.streamId : undefined;
	// Эфир ждёт запуска (остался после перезагрузки страницы): подсказка в окне
	const waiting = useLaunchState(streamId).phase === 'waiting';
	const { scrollRef, sectionRef, scrollTo } = useSectionScroll();
	const [link, setLink] = useState('');
	const [linkError, setLinkError] = useState<string>();

	// Эфир выбрал посетитель: если плеер не стартует сам, его поднимут поверх окон (см. launch.ts)
	function select(id: string) {
		markUserSelected(id);
		wallpaper.select(rutubeWallpaperId(id));
	}

	function submit(event: FormEvent) {
		event.preventDefault();
		const streamId = parseRutubeUrl(link);
		if (!streamId) {
			wallpaper.clearError();
			setLinkError(rutubeErrors.badLink);
			return;
		}
		select(streamId);
		setLink('');
		setLinkError(undefined);
	}

	const message = linkError ?? wallpaper.lastError;

	return (
		<Widget aria-label="Rutube" className={cn('flex flex-col overflow-hidden', className)}>
			<div className="px-4 pt-4">
				<WidgetHeader title="Rutube">
					{/* Пауза и звук есть только у эфира Rutube */}
					{streamId !== undefined && <RutubeControls streamId={streamId} />}
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
						placeholder="Ссылка на Rutube"
						aria-label="Ссылка на Rutube"
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
				{waiting && (
					<p role="status" className="text-xs text-amber-300">
						{rutubeHints.waiting}
					</p>
				)}
				{message && (
					<p role="alert" className="text-xs text-red-300">
						{message}
					</p>
				)}
			</form>

			<div className="flex flex-wrap gap-1.5 px-4 pt-3">
				{topicsWithStreams.map((item) => (
					<CategoryButton key={item.id} onClick={() => scrollTo(String(item.id))}>
						{item.label}
					</CategoryButton>
				))}
			</div>

			<div
				ref={scrollRef}
				className="relative min-h-0 flex-1 scrollbar-glass overflow-y-auto px-4 pb-4"
			>
				{topicsWithStreams.map((item) => (
					<section key={item.id} ref={sectionRef(String(item.id))} aria-label={item.label}>
						<h3 className={sectionTitleClass}>{item.label}</h3>
						<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
							{streamsFor(item.id).map((stream) => (
								<StreamCard
									key={stream.id}
									stream={stream}
									active={rutubeWallpaperId(stream.id) === wallpaper.current.id}
									onSelect={() => select(stream.id)}
								/>
							))}
						</div>
					</section>
				))}
			</div>
		</Widget>
	);
}

function StreamCard({
	stream,
	active,
	onSelect
}: {
	stream: RutubeStream;
	active: boolean;
	onSelect: () => void;
}) {
	// Превью не загрузилось — оставляем пустую плитку без значка сломанной картинки
	const [thumbFailed, setThumbFailed] = useState(false);

	return (
		<button
			type="button"
			onClick={onSelect}
			aria-pressed={active}
			title={stream.author ? `${stream.title} — ${stream.author}` : stream.title}
			className="group flex min-w-0 flex-col gap-1 text-left outline-none"
		>
			<span className={cn(tileClass, 'block w-full', active && tileActiveClass)}>
				{stream.thumbnail && !thumbFailed && (
					<img
						src={stream.thumbnail}
						alt=""
						loading="lazy"
						decoding="async"
						referrerPolicy="no-referrer"
						onError={() => setThumbFailed(true)}
						className="h-full w-full object-cover"
					/>
				)}
			</span>
			<span className="line-clamp-2 text-[0.7rem] leading-tight font-medium">{stream.title}</span>
			{stream.author && (
				<span className="truncate text-[0.65rem] text-white/80">{stream.author}</span>
			)}
		</button>
	);
}
