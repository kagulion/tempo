import {
	ChevronDown,
	Dices,
	Heart,
	LoaderCircle,
	Maximize2,
	Minimize2,
	Pause,
	Play,
	SkipBack,
	SkipForward,
	Volume1,
	Volume2,
	VolumeX
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Combobox, ComboboxButton } from '@/components/ui/combobox';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { usePersistentState } from '@/hooks/usePersistentState';
import { storageKeys } from '@/lib/storage';
import { Widget, WidgetHeader } from '@/widgets/Widget';

import { countryName, type Station } from './api';
import { useFavoriteStations } from './useFavoriteStations';
import { SoundBars } from './SoundBars';
import { useRadio, type RadioStatus } from './useRadio';

const statusText: Record<Exclude<RadioStatus, 'idle'>, string> = {
	loading: 'Ищем станции…',
	empty: 'В этой стране нет доступных станций',
	error: 'Не удалось подключиться к радио'
};

function parseCompact(saved: unknown) {
	return typeof saved === 'boolean' ? saved : undefined;
}

function stationName(station: Station) {
	return station.name.trim() || 'Без названия';
}

type RadioWidgetProps = {
	className?: string;
};

export function RadioWidget({ className }: RadioWidgetProps) {
	const radio = useRadio();
	// Свёрнутое окно: только звук, название станции и Play/Pause
	const [compact, setCompact] = usePersistentState(storageKeys.radioCompact, false, parseCompact);
	const { favorites, isFavorite, toggleFavorite } = useFavoriteStations();

	const { station, status, sounding } = radio;
	const favorite = isFavorite(station);
	const silent = radio.muted || radio.volume === 0;
	// Полоски двигаются, только пока звук слышен
	const audible = sounding && radio.playing && status === 'idle' && !silent;
	const noStations = status === 'loading' || radio.stations.length === 0;
	// В селекте станции по алфавиту, а «Следующая» идёт по перемешанному списку
	const stationOptions = [...radio.stations].sort((a, b) => a.name.localeCompare(b.name));

	return (
		<Widget
			aria-label="Радио"
			className={cn('flex flex-col gap-3 p-4', className, compact && 'sm:w-72')}
		>
			{/* Радио без встроенных элементов управления — кнопки ниже. Один <audio> на оба вида,
			    чтобы звук не прерывался при сворачивании */}
			<audio {...radio.audio} />

			<WidgetHeader title="Radio">
				<Button
					variant="glass"
					size="icon-sm"
					onClick={() => setCompact((value) => !value)}
					title={compact ? 'Развернуть' : 'Свернуть'}
					aria-label={compact ? 'Развернуть' : 'Свернуть'}
					aria-pressed={compact}
				>
					{compact ? <Maximize2 /> : <Minimize2 />}
				</Button>
			</WidgetHeader>

			{compact ? (
				<div className="flex items-center gap-2">
					<SoundBars active={audible} className="shrink-0" />
					{status === 'idle' && station ? (
						<p className="min-w-0 flex-1 truncate text-sm" title={stationName(station)}>
							{stationName(station)}
						</p>
					) : (
						<p className="min-w-0 flex-1 truncate text-sm text-white/70">
							{statusText[status === 'idle' ? 'loading' : status]}
						</p>
					)}
					<Button
						variant="glass"
						size="icon"
						onClick={radio.togglePlaying}
						title={radio.playing ? 'Выключить радио' : 'Включить радио'}
						aria-label={radio.playing ? 'Выключить радио' : 'Включить радио'}
					>
						{radio.playing ? <Pause /> : <Play />}
					</Button>
				</div>
			) : (
				<>
					<div className="flex flex-col gap-1.5">
						<div className="flex items-center gap-2">
							<Combobox
								aria-label="Страна"
								items={radio.countries}
								value={radio.countries.find((item) => item.code === radio.country) ?? null}
								onValueChange={(item) => radio.loadStations(item.code)}
								getLabel={(item) => item.name}
								getKey={(item) => item.code}
								placeholder={radio.countries.length === 0 ? 'Загрузка…' : 'Страна'}
								emptyText="Страна не найдена"
								className="w-36 shrink-0"
							/>

							{status === 'idle' && station ? (
								<Combobox
									aria-label="Радиостанция"
									items={stationOptions}
									value={station}
									onValueChange={radio.playStation}
									getLabel={stationName}
									getKey={(item) => item.stationuuid}
									placeholder="Радиостанция"
									emptyText="Станция не найдена"
									className="min-w-0 flex-1"
								/>
							) : (
								<p className="flex h-8 min-w-0 flex-1 items-center truncate px-1 text-sm text-white/70">
									{statusText[status === 'idle' ? 'loading' : status]}
								</p>
							)}
						</div>
					</div>

					<div className="flex items-center gap-1">
						<Button
							variant="glass"
							size="icon"
							onClick={radio.randomCountry}
							disabled={status === 'loading'}
							title="Случайное радио"
							aria-label="Случайное радио"
						>
							{status === 'loading' ? <LoaderCircle className="animate-spin" /> : <Dices />}
						</Button>

						<div className="mx-1 h-5 w-px shrink-0 bg-white/15" />

						<Button
							variant="glass"
							size="icon"
							onClick={radio.prevStation}
							disabled={noStations}
							title="Предыдущая станция"
							aria-label="Предыдущая станция"
						>
							<SkipBack />
						</Button>
						<Button
							variant="glass"
							size="icon"
							onClick={radio.togglePlaying}
							title={radio.playing ? 'Выключить радио' : 'Включить радио'}
							aria-label={radio.playing ? 'Выключить радио' : 'Включить радио'}
						>
							{radio.playing ? <Pause /> : <Play />}
						</Button>
						<Button
							variant="glass"
							size="icon"
							onClick={radio.nextStation}
							disabled={noStations}
							title="Следующая станция"
							aria-label="Следующая станция"
						>
							<SkipForward />
						</Button>

						<Button
							variant="glass"
							size="icon"
							onClick={radio.toggleMuted}
							title={silent ? 'Включить звук' : 'Выключить звук'}
							aria-label={silent ? 'Включить звук' : 'Выключить звук'}
						>
							{silent ? <VolumeX /> : radio.volume < 0.5 ? <Volume1 /> : <Volume2 />}
						</Button>
						<Slider
							aria-label="Громкость"
							min={0}
							max={1}
							step={0.01}
							value={radio.muted ? 0 : radio.volume}
							onValueChange={radio.changeVolume}
							className="mr-1 w-16 shrink-0 sm:w-20"
						/>

						{/* Сплит-кнопка: сердечко добавляет станцию, шеврон открывает список избранного */}
						<div className="ml-auto flex items-center">
							<Button
								variant="glass"
								size="icon"
								onClick={() => station && toggleFavorite(station)}
								disabled={!station || status !== 'idle'}
								title={favorite ? 'Убрать из избранного' : 'Добавить в избранное'}
								aria-label={favorite ? 'Убрать из избранного' : 'Добавить в избранное'}
								aria-pressed={favorite}
								className="rounded-r-none"
							>
								<Heart className={cn(favorite && 'fill-current')} />
							</Button>
							<ComboboxButton
								aria-label="Избранные станции"
								title="Избранные станции"
								items={favorites}
								value={favorite ? station : null}
								onValueChange={radio.playStation}
								getLabel={stationName}
								getKey={(item) => item.stationuuid}
								getHint={(item) => countryName(item.countrycode)}
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
		</Widget>
	);
}
