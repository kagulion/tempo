import { useEffect, useRef, useState } from 'react';
import {
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Dices,
	Heart,
	LoaderCircle,
	Music,
	Pause,
	Play,
	Radio,
	SkipBack,
	SkipForward,
	Volume1,
	Volume2,
	VolumeX
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Combobox, ComboboxButton } from '@/components/ui/combobox';
import { Slider } from '@/components/ui/slider';
import {
	countryName,
	detectCountryCode,
	fetchCountries,
	fetchStations,
	type RadioCountry,
	type Station
} from '@/lib/radio';
import { cn } from '@/lib/utils';

import orcsTavern from '@/assets/wallpapers/orcs-tavern.png';
import trollsTavern from '@/assets/wallpapers/trolls-tavern.png';

import hearthsideLullaby from '@/assets/music/hearthside-lullaby.mp3';
import tavernBeforeBattle from '@/assets/music/tavern-before-battle.mp3';
import tavernTwilight from '@/assets/music/tavern-twilight.mp3';

const backgrounds = [
	{
		title: 'Таверна у орков',
		url: orcsTavern
	},
	{
		title: 'Таверна у троллей',
		url: trollsTavern
	}
];

// Загруженная музыка временно скрыта: играет только радио. Код оставлен, чтобы вернуть её флагом
const musicEnabled = false;

// Список треков для фона
const playlist = [hearthsideLullaby, tavernBeforeBattle, tavernTwilight];

const controlButtonClass =
	'bg-white/10 px-3 text-sm font-medium text-white transition-colors hover:bg-white/20 hover:text-white';

const radioButtonClass = 'text-white/80 hover:bg-white/15 hover:text-white';

const favoritesKey = 'tempo:favorite-stations';

type Mode = 'music' | 'radio';

// Перемешиваем станции, чтобы каждый раз звучало что-то новое, а не одни и те же лидеры рейтинга
function shuffle<T>(items: T[]) {
	const result = [...items];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

// Избранные станции храним целиком, чтобы потом показать их без запроса к API
function loadFavorites(): Record<string, Station> {
	try {
		return JSON.parse(localStorage.getItem(favoritesKey) ?? '{}');
	} catch {
		return {};
	}
}

export default function App() {
	const audioRef = useRef<HTMLAudioElement>(null);
	const [currentTrack, setCurrentTrack] = useState(0);
	const [currentBg, setCurrentBg] = useState(0);

	const [mode, setMode] = useState<Mode>(musicEnabled ? 'music' : 'radio');
	const [soundOn, setSoundOn] = useState(true);
	const [volume, setVolume] = useState(0.8);
	const [muted, setMuted] = useState(false);
	const [stations, setStations] = useState<Station[]>([]);
	const [currentStation, setCurrentStation] = useState(0);
	const [radioStatus, setRadioStatus] = useState<'idle' | 'loading' | 'empty' | 'error'>('idle');
	const [countries, setCountries] = useState<RadioCountry[]>([]);
	const [country, setCountry] = useState(detectCountryCode);
	const [favorites, setFavorites] = useState(loadFavorites);
	// Номер последнего запроса станций — ответы на устаревшие запросы игнорируем
	const stationsRequest = useRef(0);
	// Сколько станций подряд не запустилось — чтобы не перебирать список бесконечно
	const failedStations = useRef(0);

	const station = stations[currentStation];
	// В селекте станции по алфавиту, а «Следующая» идёт по перемешанному списку
	const stationOptions = [...stations].sort((a, b) => a.name.localeCompare(b.name));
	const audioSrc = mode === 'music' ? playlist[currentTrack] : station?.url_resolved;
	const favoriteOptions = Object.values(favorites).sort((a, b) => a.name.localeCompare(b.name));
	const isFavorite = station ? station.stationuuid in favorites : false;
	const silent = muted || volume === 0;
	const noStations = radioStatus === 'loading' || stations.length === 0;

	function nextTrack() {
		setCurrentTrack((track) => (track + 1) % playlist.length);
	}

	// first — станция, с которой начать (например, выбранная из избранного)
	async function loadStations(countryCode: string, first?: Station) {
		const request = ++stationsRequest.current;
		setCountry(countryCode);
		setRadioStatus('loading');
		try {
			const list = await fetchStations(countryCode);
			if (request !== stationsRequest.current) return;
			if (list.length === 0 && !first) {
				setStations([]);
				setRadioStatus('empty');
				return;
			}
			failedStations.current = 0;
			const shuffled = shuffle(list);
			// Станция могла выпасть из топа страны — тогда добавляем её из сохранённых данных
			setStations(
				first
					? [first, ...shuffled.filter((item) => item.stationuuid !== first.stationuuid)]
					: shuffled
			);
			setCurrentStation(0);
			setRadioStatus('idle');
		} catch {
			if (request === stationsRequest.current) setRadioStatus('error');
		}
	}

	async function loadCountries() {
		try {
			const list = await fetchCountries();
			setCountries(list);
			return list;
		} catch {
			return [];
		}
	}

	async function randomCountry() {
		const list = countries.length > 0 ? countries : await loadCountries();
		// Для случайного выбора берём страны с большим количеством станций
		const candidates = list.filter((item) => item.stationCount >= 30 && item.code !== country);
		if (candidates.length === 0) return;
		await loadStations(candidates[Math.floor(Math.random() * candidates.length)].code);
	}

	function switchMode(next: Mode) {
		setMode(next);
		if (next !== 'radio') return;
		if (stations.length === 0) loadStations(country);
		if (countries.length === 0) loadCountries();
	}

	// Без музыки радио — единственный режим, поэтому станции грузим сразу
	useEffect(() => {
		if (!musicEnabled) switchMode('radio');
	}, []);

	function selectStation(uuid: string) {
		const index = stations.findIndex((item) => item.stationuuid === uuid);
		if (index === -1) return;
		failedStations.current = 0;
		setCurrentStation(index);
	}

	function selectFavorite(favorite: Station) {
		const index = stations.findIndex((item) => item.stationuuid === favorite.stationuuid);
		if (index !== -1) {
			failedStations.current = 0;
			setCurrentStation(index);
			return;
		}
		// Станция из другой страны — переключаемся на неё и начинаем с выбранной
		loadStations(favorite.countrycode, favorite);
	}

	function nextStation() {
		setCurrentStation((index) => (index + 1) % stations.length);
	}

	function prevStation() {
		setCurrentStation((index) => (index - 1 + stations.length) % stations.length);
	}

	function toggleFavorite() {
		if (!station) return;
		setFavorites((current) => {
			const next = { ...current };
			if (station.stationuuid in next) delete next[station.stationuuid];
			else next[station.stationuuid] = station;
			return next;
		});
	}

	function changeVolume(value: number) {
		setVolume(value);
		if (value > 0) setMuted(false);
	}

	function handleAudioError() {
		if (mode !== 'radio' || stations.length === 0) return;
		failedStations.current += 1;
		if (failedStations.current >= stations.length) {
			setRadioStatus('error');
			return;
		}
		nextStation();
	}

	function toggleSound() {
		// Прямой эфир после паузы отстаёт — перезагружаем поток, чтобы вернуться к живому звуку
		if (!soundOn && mode === 'radio') audioRef.current?.load();
		setSoundOn((on) => !on);
	}

	useEffect(() => {
		try {
			localStorage.setItem(favoritesKey, JSON.stringify(favorites));
		} catch {
			// Хранилище недоступно (приватный режим) — избранное живёт до перезагрузки
		}
	}, [favorites]);

	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;
		audio.volume = volume;
		audio.muted = muted;
	}, [volume, muted]);

	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;
		// Звук выключен или станции ещё грузятся — глушим то, что играло до этого
		if (!audioSrc || !soundOn) {
			audio.pause();
			return;
		}

		const listeners = new AbortController();

		// Пробуем запустить воспроизведение сразу
		audio.play().catch(() => {
			// Браузеры блокируют звук до первого клика — слушаем первое взаимодействие
			const startAudio = () => {
				audio.play().catch(() => {});
				listeners.abort();
			};

			window.addEventListener('click', startAudio, { signal: listeners.signal });
			window.addEventListener('keydown', startAudio, { signal: listeners.signal });
		});

		return () => listeners.abort();
	}, [audioSrc, soundOn]);

	function nextBg() {
		setCurrentBg((bg) => (bg + 1) % backgrounds.length);
	}

	function prevBg() {
		setCurrentBg((bg) => (bg - 1 + backgrounds.length) % backgrounds.length);
	}

	return (
		<>
			{/* Фоновая музыка или радио без элементов управления */}
			<audio
				ref={audioRef}
				src={audioSrc}
				onEnded={mode === 'music' ? nextTrack : nextStation}
				onPlaying={() => (failedStations.current = 0)}
				onError={handleAudioError}
			/>

			<main className="relative h-screen w-screen overflow-hidden bg-black text-white">
				{/* Фоновое изображение */}
				<img
					src={backgrounds[currentBg].url}
					alt={backgrounds[currentBg].title}
					className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out"
				/>
				<div className="absolute inset-0" />

				{/* Переключение фона в левом нижнем углу. На телефоне радио занимает всю ширину снизу — там панель уходит наверх */}
				<div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/50 px-3 py-3 shadow-2xl backdrop-blur-md sm:top-auto sm:bottom-4 lg:bottom-8 lg:left-8">
					<Button
						variant="ghost"
						size="icon-lg"
						onClick={prevBg}
						title="Предыдущий фон"
						aria-label="Предыдущий фон"
						className={controlButtonClass}
					>
						<ChevronLeft />
					</Button>
					<Button
						variant="ghost"
						size="icon-lg"
						onClick={nextBg}
						title="Следующий фон"
						aria-label="Следующий фон"
						className={controlButtonClass}
					>
						<ChevronRight />
					</Button>

					{musicEnabled && (
						<Button
							variant="ghost"
							size="icon-lg"
							onClick={() => switchMode(mode === 'music' ? 'radio' : 'music')}
							title={mode === 'music' ? 'Включить радио' : 'Включить музыку'}
							aria-label={mode === 'music' ? 'Включить радио' : 'Включить музыку'}
							className={controlButtonClass}
						>
							{mode === 'music' ? <Radio /> : <Music />}
						</Button>
					)}
				</div>

				{/* Виджет радио */}
				<section
					aria-label="Радио"
					className="absolute right-4 bottom-4 left-4 z-10 flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/50 p-4 shadow-2xl backdrop-blur-md sm:left-auto sm:w-[26rem] lg:right-8 lg:bottom-8"
				>
					<div className="flex flex-col gap-1.5">
						<span className="text-xs font-medium text-white/60">Radio</span>
						<div className="flex items-center gap-2">
							<Combobox
								aria-label="Страна"
								items={countries}
								value={countries.find((item) => item.code === country) ?? null}
								onValueChange={(item) => loadStations(item.code)}
								getLabel={(item) => item.name}
								getKey={(item) => item.code}
								placeholder={countries.length === 0 ? 'Загрузка…' : 'Страна'}
								emptyText="Страна не найдена"
								className="w-36 shrink-0"
							/>

							{radioStatus === 'idle' && station ? (
								<Combobox
									aria-label="Радиостанция"
									items={stationOptions}
									value={station}
									onValueChange={(item) => selectStation(item.stationuuid)}
									getLabel={(item) => item.name.trim() || 'Без названия'}
									getKey={(item) => item.stationuuid}
									placeholder="Радиостанция"
									emptyText="Станция не найдена"
									className="min-w-0 flex-1"
								/>
							) : (
								<p className="flex h-8 min-w-0 flex-1 items-center truncate px-1 text-sm text-white/70">
									{radioStatus === 'loading'
										? 'Ищем станции…'
										: radioStatus === 'empty'
											? 'В этой стране нет доступных станций'
											: 'Не удалось подключиться к радио'}
								</p>
							)}
						</div>
					</div>

					<div className="flex items-center gap-1">
						<Button
							variant="ghost"
							size="icon"
							onClick={randomCountry}
							disabled={radioStatus === 'loading'}
							title="Случайное радио"
							aria-label="Случайное радио"
							className={radioButtonClass}
						>
							{radioStatus === 'loading' ? <LoaderCircle className="animate-spin" /> : <Dices />}
						</Button>

						<div className="mx-1 h-5 w-px shrink-0 bg-white/15" />

						<Button
							variant="ghost"
							size="icon"
							onClick={toggleSound}
							title={soundOn ? 'Выключить радио' : 'Включить радио'}
							aria-label={soundOn ? 'Выключить радио' : 'Включить радио'}
							className={radioButtonClass}
						>
							{soundOn ? <Pause /> : <Play />}
						</Button>

						<Button
							variant="ghost"
							size="icon"
							onClick={() => setMuted((value) => !value)}
							title={silent ? 'Включить звук' : 'Выключить звук'}
							aria-label={silent ? 'Включить звук' : 'Выключить звук'}
							className={radioButtonClass}
						>
							{silent ? <VolumeX /> : volume < 0.5 ? <Volume1 /> : <Volume2 />}
						</Button>
						<Slider
							aria-label="Громкость"
							min={0}
							max={1}
							step={0.01}
							value={muted ? 0 : volume}
							onValueChange={changeVolume}
							className="mr-1 w-20 shrink-0"
						/>

						<Button
							variant="ghost"
							size="icon"
							onClick={prevStation}
							disabled={noStations}
							title="Предыдущая станция"
							aria-label="Предыдущая станция"
							className={radioButtonClass}
						>
							<SkipBack />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={nextStation}
							disabled={noStations}
							title="Следующая станция"
							aria-label="Следующая станция"
							className={radioButtonClass}
						>
							<SkipForward />
						</Button>

						{/* Сплит-кнопка: сердечко добавляет станцию, шеврон открывает список избранного */}
						<div className="ml-auto flex items-center">
							<Button
								variant="ghost"
								size="icon"
								onClick={toggleFavorite}
								disabled={!station || radioStatus !== 'idle'}
								title={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
								aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
								aria-pressed={isFavorite}
								className={cn(radioButtonClass, 'rounded-r-none')}
							>
								<Heart className={cn(isFavorite && 'fill-current')} />
							</Button>
							<ComboboxButton
								aria-label="Избранные станции"
								title="Избранные станции"
								items={favoriteOptions}
								value={isFavorite ? station : null}
								onValueChange={selectFavorite}
								getLabel={(item) => item.name.trim() || 'Без названия'}
								getKey={(item) => item.stationuuid}
								getHint={(item) => countryName(item.countrycode)}
								searchPlaceholder="Поиск по избранному"
								emptyText={
									favoriteOptions.length === 0
										? 'Нажмите на сердечко, чтобы добавить станцию'
										: 'Станция не найдена'
								}
								className="flex h-8 w-5 items-center justify-center rounded-r-lg text-white/80 transition-colors outline-none hover:bg-white/15 hover:text-white focus-visible:ring-3 focus-visible:ring-white/20 data-popup-open:bg-white/15 data-popup-open:text-white"
							>
								<ChevronDown className="size-4" />
							</ComboboxButton>
						</div>
					</div>
				</section>
			</main>
		</>
	);
}
