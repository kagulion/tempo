import { BackgroundMusic } from '@/widgets/music/BackgroundMusic';
import { RadioWidget } from '@/widgets/radio/RadioWidget';
import { TimerWidget } from '@/widgets/timer/TimerWidget';
import { useWallpaper } from '@/widgets/wallpaper/useWallpaper';
import { WallpaperSwitcher } from '@/widgets/wallpaper/WallpaperSwitcher';

// Загруженная музыка временно скрыта: вместо неё играет радио. Код оставлен, чтобы вернуть её флагом
const musicEnabled = false;

// Раскладка страницы: фон и расстановка виджетов. Логика каждого виджета — в src/widgets/
export default function App() {
	const wallpaper = useWallpaper();

	return (
		<main className="relative h-screen w-screen overflow-hidden bg-black text-white">
			{/* Фоновое изображение */}
			<img
				src={wallpaper.current.url}
				alt={wallpaper.current.title}
				className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out"
			/>

			{/* Левый нижний угол. На телефоне радио занимает всю ширину снизу — там панель уходит наверх */}
			<WallpaperSwitcher
				faction={wallpaper.faction}
				index={wallpaper.index}
				count={wallpaper.count}
				onFactionChange={wallpaper.setFaction}
				onPrev={wallpaper.prev}
				onNext={wallpaper.next}
				className="absolute top-4 left-4 sm:top-auto sm:bottom-4 lg:bottom-8 lg:left-8"
			/>

			{/* Правая нижняя колонка: таймер над радио. На телефоне — снизу во всю ширину */}
			<div className="absolute right-4 bottom-4 left-4 flex flex-col gap-3 sm:left-auto sm:w-[26rem] lg:right-8 lg:bottom-8">
				<TimerWidget />
				{musicEnabled ? <BackgroundMusic /> : <RadioWidget />}
			</div>
		</main>
	);
}
