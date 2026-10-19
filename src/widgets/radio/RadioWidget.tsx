import {
	ChevronDown,
	Dices,
	Heart,
	Maximize2,
	Minimize2,
	Pause,
	Play,
	Shuffle,
	ListOrdered,
	SkipBack,
	SkipForward,
	Volume1,
	Volume2,
	VolumeX
} from 'lucide-react';
import { useLayoutEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Combobox, ComboboxButton } from '@/components/ui/combobox';
import { Slider } from '@/components/ui/slider';
import { iosWebKit } from '@/lib/platform';
import { easeInOutStrong, easeOutStrong, prefersReducedMotion } from '@/lib/flip';
import { cn } from '@/lib/utils';
import { usePersistentState } from '@/hooks/usePersistentState';
import { storageKeys } from '@/lib/storage';
import { Widget, WidgetHeader } from '@/widgets/Widget';

import { genres } from './genres';
import { trackLabel } from './nowPlaying';
import type { RecordStation, RecordTrack } from './record';
import { useFavoriteStations } from './useFavoriteStations';
import { SoundBars } from './SoundBars';
import { useRadio, type RadioStatus } from './useRadio';

const statusText: Record<Exclude<RadioStatus, 'idle'>, string> = {
	loading: 'Ищем станции…',
	empty: 'Нет доступных станций',
	error: 'Не удалось подключиться к радио'
};

const chipClassName =
	'h-7 shrink-0 rounded-lg border border-white/10 bg-white/10 px-2.5 text-xs text-white/80 transition-colors outline-none hover:bg-white/20 hover:text-white focus-visible:ring-3 focus-visible:ring-white/20 aria-pressed:bg-white/30 aria-pressed:text-white disabled:opacity-50';

function parseCompact(saved: unknown) {
	return typeof saved === 'boolean' ? saved : undefined;
}

function stationName(station: RecordStation) {
	return station.title.trim() || 'Без названия';
}

// «Исполнитель — Песня» одной строкой с обрезкой и маленькая обложка, если она есть
function TrackLine({ track, className }: { track: RecordTrack; className?: string }) {
	const label = trackLabel(track);
	return (
		<div className={cn('flex min-w-0 items-center gap-2 text-xs text-white/70', className)}>
			{track.cover && (
				<img
					// Новая обложка — новый элемент: скрытая по ошибке не мешает следующей
					key={track.cover}
					src={track.cover}
					alt=""
					loading="lazy"
					referrerPolicy="no-referrer"
					onError={(event) => {
						event.currentTarget.hidden = true;
					}}
					className="size-5 shrink-0 rounded object-cover"
				/>
			)}
			<span className="min-w-0 truncate" title={label}>
				{label}
			</span>
		</div>
	);
}

type RadioWidgetProps = {
	className?: string;
	// Окно открыто: пока оно закрыто и радио не играет, список станций не запрашиваем
	open?: boolean;
};

export function RadioWidget({ className, open = true }: RadioWidgetProps) {
	const radio = useRadio(open);
	// Свёрнутое окно: только звук, название станции и Play/Pause
	const [compact, setCompact] = usePersistentState(storageKeys.radioCompact, false, parseCompact);
	const { favorites, isFavorite, toggleFavorite } = useFavoriteStations();
	const sectionRef = useRef<HTMLElement>(null);
	const bodyRef = useRef<HTMLDivElement>(null);
	// Размер окна до переключения и текущая анимация размера
	const fromSize = useRef<{ width: number; height: number } | null>(null);
	const sizeAnimation = useRef<Animation | null>(null);

	function toggleCompact() {
		const section = sectionRef.current;
		if (section) {
			// Размер берём до отмены анимации: он и есть фактический, с которого начнём новую
			const rect = section.getBoundingClientRect();
			fromSize.current = { width: rect.width, height: rect.height };
			sizeAnimation.current?.cancel();
			// Событие cancel придёт позже, а новый размер меряем уже после коммита — снимаем стили прерванной анимации сразу
			section.style.overflow = '';
			if (bodyRef.current) bodyRef.current.style.width = '';
		}
		setCompact((value) => !value);
	}

	// Окно меняет размер само (ширина из placement, высота по содержимому), поэтому после коммита
	// анимируем width/height «как аккордеон»: transform исказил бы текст и стекло (backdrop-blur),
	// а размер окна нужен соседям по столбцу
	useLayoutEffect(() => {
		const from = fromSize.current;
		fromSize.current = null;
		const section = sectionRef.current;
		const body = bodyRef.current;
		if (!from || !section || !body) return;

		body.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: easeOutStrong });
		if (prefersReducedMotion()) return;

		const rect = section.getBoundingClientRect();
		if (rect.width === from.width && rect.height === from.height) return;

		// Пока окно меняет размер, содержимое держит итоговую ширину: текст и жанры не переносятся
		// на каждом кадре, а полоса прокрутки не мелькает
		section.style.overflow = 'hidden';
		body.style.width = `${body.getBoundingClientRect().width}px`;
		const animation = section.animate(
			[
				{ width: `${from.width}px`, height: `${from.height}px` },
				{ width: `${rect.width}px`, height: `${rect.height}px` }
			],
			{ duration: 250, easing: easeInOutStrong }
		);
		sizeAnimation.current = animation;
		const end = () => {
			// Отменённую анимацию уже заменила новая — её стили не трогаем
			if (sizeAnimation.current !== animation) return;
			sizeAnimation.current = null;
			section.style.overflow = '';
			body.style.width = '';
		};
		animation.addEventListener('finish', end);
		animation.addEventListener('cancel', end);
	}, [compact]);

	const { station, status, sounding, source } = radio;
	const shuffled = radio.sort === 'shuffle';
	const favorite = isFavorite(station);
	const silent = radio.muted || radio.volume === 0;
	// Полоски двигаются, только пока звук слышен
	const audible = sounding && radio.playing && status === 'idle' && !silent;
	const noStations = status === 'loading' || radio.stations.length === 0;
	const emptyText =
		source.kind === 'genre' ? 'В этом жанре нет доступных станций' : statusText.empty;
	return (
		<Widget
			ref={sectionRef}
			aria-label="Радио"
			className={cn('flex flex-col gap-3 p-4', className, compact && 'sm:w-72')}
		>
			{/* Радио без встроенных элементов управления — кнопки ниже. Один <audio> на оба вида,
			    чтобы звук не прерывался при сворачивании */}
			<audio {...radio.audio} />

			<WidgetHeader title="Радио">
				<Button
					variant="glass"
					size="icon-sm"
					onClick={toggleCompact}
					hint={compact ? 'Развернуть' : 'Свернуть'}
					aria-pressed={compact}
				>
					{compact ? <Maximize2 /> : <Minimize2 />}
				</Button>
			</WidgetHeader>

			<div ref={bodyRef} className="flex flex-col gap-3">
				{compact ? (
					<div className="flex items-center gap-2">
						<SoundBars active={audible} className="shrink-0" />
						{status === 'idle' && station ? (
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm" title={stationName(station)}>
									{stationName(station)}
								</p>
								{radio.track && <TrackLine track={radio.track} />}
							</div>
						) : (
							<p className="min-w-0 flex-1 truncate text-sm text-white/70">
								{statusText[status === 'idle' ? 'loading' : status]}
							</p>
						)}
						<Button
							variant="glass"
							size="icon"
							onClick={radio.togglePlaying}
							hint={radio.playing ? 'Выключить радио' : 'Включить радио'}
						>
							{radio.playing ? <Pause /> : <Play />}
						</Button>
					</div>
				) : (
					<>
						{/* Источники (все станции и пресеты) одним потоком с переносом строк, без скрытой прокрутки */}
						<div className="flex flex-wrap items-center gap-1">
							<div role="group" aria-label="Источник станций" className="contents">
								<button
									type="button"
									onClick={() => radio.loadStations({ kind: 'all' })}
									aria-pressed={source.kind === 'all'}
									className={chipClassName}
								>
									Все станции
								</button>
								{genres.map((genre) => (
									<button
										key={genre.id}
										type="button"
										onClick={() => radio.loadStations({ kind: 'genre', genre: genre.id })}
										aria-pressed={source.kind === 'genre' && source.genre === genre.id}
										className={chipClassName}
									>
										{genre.label}
									</button>
								))}
							</div>
						</div>

						<div className="flex items-center gap-2">
							{status === 'idle' && station ? (
								<Combobox
									aria-label="Радиостанция"
									items={radio.stations}
									value={station}
									onValueChange={radio.playStation}
									getLabel={stationName}
									getKey={(item) => String(item.id)}
									placeholder="Радиостанция"
									emptyText="Станция не найдена"
									className="min-w-0 flex-1"
								/>
							) : (
								<p className="flex h-8 min-w-0 flex-1 items-center truncate px-1 text-sm text-white/70">
									{status === 'empty'
										? emptyText
										: statusText[status === 'idle' ? 'loading' : status]}
								</p>
							)}
							<Button
								variant="glass"
								size="icon-sm"
								className="shrink-0"
								onClick={() => radio.changeSort(shuffled ? 'default' : 'shuffle')}
								title={
									shuffled
										? 'Порядок: перемешать. Переключить на «По порядку»'
										: 'Порядок: по порядку. Переключить на «Перемешать»'
								}
								aria-pressed={shuffled}
								aria-label={shuffled ? 'Порядок: перемешать' : 'Порядок: по порядку'}
							>
								{shuffled ? <Shuffle /> : <ListOrdered />}
							</Button>
						</div>

						{status === 'idle' && radio.track && <TrackLine track={radio.track} className="px-1" />}

						<div className="flex items-center gap-1">
							<Button
								variant="glass"
								size="icon"
								onClick={radio.randomStation}
								disabled={noStations || radio.stations.length < 2}
								hint="Случайная станция"
							>
								<Dices />
							</Button>

							<div className="mx-1 h-5 w-px shrink-0 bg-white/15" />

							<Button
								variant="glass"
								size="icon"
								onClick={radio.prevStation}
								disabled={noStations}
								hint="Предыдущая станция"
							>
								<SkipBack />
							</Button>
							<Button
								variant="glass"
								size="icon"
								onClick={radio.togglePlaying}
								hint={radio.playing ? 'Выключить радио' : 'Включить радио'}
							>
								{radio.playing ? <Pause /> : <Play />}
							</Button>
							<Button
								variant="glass"
								size="icon"
								onClick={radio.nextStation}
								disabled={noStations}
								hint="Следующая станция"
							>
								<SkipForward />
							</Button>

							<Button
								variant="glass"
								size="icon"
								onClick={radio.toggleMuted}
								hint={silent ? 'Включить звук' : 'Выключить звук'}
							>
								{silent ? <VolumeX /> : radio.volume < 0.5 ? <Volume1 /> : <Volume2 />}
							</Button>
							{/* На iOS громкость <audio> только для чтения: слайдер скрыт, звук правят кнопки телефона */}
							{!iosWebKit && (
								<Slider
									label="Громкость радио"
									min={0}
									max={1}
									step={0.01}
									value={radio.muted ? 0 : radio.volume}
									onValueChange={radio.changeVolume}
									className="mr-1 w-16 shrink-0 sm:w-20"
								/>
							)}

							{/* Сплит-кнопка: сердечко добавляет станцию, шеврон открывает список избранного */}
							<div className="ml-auto flex items-center">
								<Button
									variant="glass"
									size="icon"
									onClick={() => station && toggleFavorite(station)}
									disabled={!station || status !== 'idle'}
									hint={favorite ? 'Убрать из избранного' : 'Добавить в избранное'}
									aria-pressed={favorite}
									className="rounded-r-none"
								>
									<Heart className={cn(favorite && 'fill-current')} />
								</Button>
								<ComboboxButton
									hint="Избранные станции"
									items={favorites}
									value={favorite ? station : null}
									onValueChange={radio.playStation}
									getLabel={stationName}
									getKey={(item) => String(item.id)}
									searchPlaceholder="Поиск по избранному"
									emptyText={
										favorites.length === 0
											? 'Нажмите на сердечко, чтобы добавить станцию'
											: 'Станция не найдена'
									}
									className="flex h-8 w-5 items-center justify-center rounded-r-lg text-white/80 transition-colors outline-none hover:bg-white/15 hover:text-white focus-visible:ring-3 focus-visible:ring-white/20 data-popup-open:bg-white/15 data-popup-open:text-white"
								>
									<ChevronDown className="size-4" />
								</ComboboxButton>
							</div>
						</div>
					</>
				)}
			</div>
		</Widget>
	);
}
