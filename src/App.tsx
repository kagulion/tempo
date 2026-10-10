import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

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

export default function App() {
	const audioRef = useRef<HTMLAudioElement>(null);
	const [currentTrack, setCurrentTrack] = useState(0);
	const [currentBg, setCurrentBg] = useState(0);

	function nextTrack() {
		setCurrentTrack((track) => (track + 1) % playlist.length);
	}

	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;

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
	}, [currentTrack]);

	function nextBg() {
		setCurrentBg((bg) => (bg + 1) % backgrounds.length);
	}

	function prevBg() {
		setCurrentBg((bg) => (bg - 1 + backgrounds.length) % backgrounds.length);
	}

	return (
		<>
			{/* Фоновая музыка без элементов управления */}
			<audio ref={audioRef} src={playlist[currentTrack]} onEnded={nextTrack} />

			<main className="relative h-screen w-screen overflow-hidden bg-black text-white">
				{/* Фоновое изображение */}
				<img
					src={backgrounds[currentBg].url}
					alt={backgrounds[currentBg].title}
					className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out"
				/>
				<div className="absolute inset-0" />

				{/* Панель управления */}
				<div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 items-center gap-4 rounded-2xl border border-white/10 bg-black/50 px-6 py-3 shadow-2xl backdrop-blur-md">
					<Button variant="ghost" onClick={prevBg} className={controlButtonClass}>
						←
					</Button>
					<Button variant="ghost" onClick={nextBg} className={controlButtonClass}>
						→
					</Button>
				</div>
			</main>
		</>
	);
}
