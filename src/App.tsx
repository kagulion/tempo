import { useEffect, useRef, useState } from 'react';
import {
	ChevronLeft,
	ChevronRight,
	Globe,
	LoaderCircle,
	Music,
	Radio,
	SkipForward,
	Volume2,
	VolumeX
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { fetchRandomCountryCode, fetchStations, type Station } from '@/lib/radio';

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

// Список треков для фона
const playlist = [hearthsideLullaby, tavernBeforeBattle, tavernTwilight];

const controlButtonClass =
	'bg-white/10 px-3 text-sm font-medium text-white transition-colors hover:bg-white/20 hover:text-white';

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

export default function App() {
	const audioRef = useRef<HTMLAudioElement>(null);
	const [currentTrack, setCurrentTrack] = useState(0);
	const [currentBg, setCurrentBg] = useState(0);

	const [mode, setMode] = useState<Mode>('music');
	const [soundOn, setSoundOn] = useState(true);
	const [stations, setStations] = useState<Station[]>([]);
	const [currentStation, setCurrentStation] = useState(0);
	const [radioStatus, setRadioStatus] = useState<'idle' | 'loading' | 'error'>('idle');
	// Сколько станций подряд не запустилось — чтобы не перебирать список бесконечно
	const failedStations = useRef(0);

	const station = stations[currentStation];
	const audioSrc = mode === 'music' ? playlist[currentTrack] : station?.url_resolved;

	function nextTrack() {
		setCurrentTrack((track) => (track + 1) % playlist.length);
	}

	async function loadStations(countryCode?: string) {
		setRadioStatus('loading');
		try {
			const list = await fetchStations(countryCode);
			if (list.length === 0) throw new Error('Нет доступных станций');
			failedStations.current = 0;
			setStations(shuffle(list));
			setCurrentStation(0);
			setRadioStatus('idle');
		} catch {
			setRadioStatus('error');
		}
	}

	async function randomCountry() {
		setRadioStatus('loading');
		try {
			await loadStations(await fetchRandomCountryCode());
		} catch {
			setRadioStatus('error');
		}
	}

	function switchMode(next: Mode) {
		setMode(next);
		if (next === 'radio' && stations.length === 0) loadStations();
	}

	function nextStation() {
		setCurrentStation((index) => (index + 1) % stations.length);
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

				{/* Панель управления */}
				<div className="absolute bottom-8 left-1/2 z-10 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-col items-center gap-3 rounded-2xl border border-white/10 bg-black/50 px-6 py-3 shadow-2xl backdrop-blur-md">
					{mode === 'radio' && (
						<p className="max-w-full truncate text-sm text-white/80">
							{radioStatus === 'loading'
								? 'Ищем станции…'
								: radioStatus === 'error'
									? 'Не удалось подключиться к радио'
									: station && `${station.name.trim()} · ${station.country}`}
						</p>
					)}

					<div className="flex items-center justify-center gap-2">
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

						<div className="mx-1 h-6 w-px bg-white/15" />

						<Button
							variant="ghost"
							size="icon-lg"
							onClick={toggleSound}
							title={soundOn ? 'Выключить звук' : 'Включить звук'}
							aria-label={soundOn ? 'Выключить звук' : 'Включить звук'}
							className={controlButtonClass}
						>
							{soundOn ? <Volume2 /> : <VolumeX />}
						</Button>
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

						{mode === 'radio' && (
							<>
								<Button
									variant="ghost"
									size="icon-lg"
									onClick={nextStation}
									disabled={radioStatus === 'loading' || stations.length === 0}
									title="Следующая станция"
									aria-label="Следующая станция"
									className={controlButtonClass}
								>
									<SkipForward />
								</Button>
								<Button
									variant="ghost"
									size="icon-lg"
									onClick={randomCountry}
									disabled={radioStatus === 'loading'}
									title="Случайная страна"
									aria-label="Случайная страна"
									className={controlButtonClass}
								>
									{radioStatus === 'loading' ? (
										<LoaderCircle className="animate-spin" />
									) : (
										<Globe />
									)}
								</Button>
							</>
						)}
					</div>
				</div>
			</main>
		</>
	);
}
