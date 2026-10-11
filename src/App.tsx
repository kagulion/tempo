import { useState } from 'react';

import { BackgroundMusic } from '@/widgets/music/BackgroundMusic';
import { RadioWidget } from '@/widgets/radio/RadioWidget';
import { WallpaperSwitcher } from '@/widgets/wallpaper/WallpaperSwitcher';
import { wallpapers } from '@/widgets/wallpaper/wallpapers';

// Загруженная музыка временно скрыта: вместо неё играет радио. Код оставлен, чтобы вернуть её флагом
const musicEnabled = false;

// Раскладка страницы: фон и расстановка виджетов. Логика каждого виджета — в src/widgets/
export default function App() {
	const [currentBg, setCurrentBg] = useState(0);

	function nextBg() {
		setCurrentBg((bg) => (bg + 1) % wallpapers.length);
	}

	function prevBg() {
		setCurrentBg((bg) => (bg - 1 + wallpapers.length) % wallpapers.length);
	}

	return (
		<main className="relative h-screen w-screen overflow-hidden bg-black text-white">
			{/* Фоновое изображение */}
			<img
				src={wallpapers[currentBg].url}
				alt={wallpapers[currentBg].title}
				className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out"
			/>

			{/* Левый нижний угол. На телефоне радио занимает всю ширину снизу — там панель уходит наверх */}
			<WallpaperSwitcher
				onPrev={prevBg}
				onNext={nextBg}
				className="absolute top-4 left-4 sm:top-auto sm:bottom-4 lg:bottom-8 lg:left-8"
			/>

			{musicEnabled ? (
				<BackgroundMusic />
			) : (
				<RadioWidget className="absolute right-4 bottom-4 left-4 sm:left-auto sm:w-[26rem] lg:right-8 lg:bottom-8" />
			)}
		</main>
	);
}
