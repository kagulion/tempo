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

			{/* На телефоне обои и таймер идут столбиком сверху, а радио занимает низ. С sm обёртка
			    растворяется (sm:contents), и каждый виджет встаёт в свой угол сам */}
			<div className="absolute top-4 right-4 left-4 flex flex-col items-start gap-3 sm:contents">
				{/* Левый нижний угол */}
				<WallpaperSwitcher
					faction={wallpaper.faction}
					index={wallpaper.index}
					count={wallpaper.count}
					onFactionChange={wallpaper.setFaction}
					onPrev={wallpaper.prev}
					onNext={wallpaper.next}
					className="sm:absolute sm:bottom-4 sm:left-4 lg:bottom-8 lg:left-8"
				/>

				{/* Правый верхний угол */}
				<TimerWidget className="w-full sm:absolute sm:top-4 sm:right-4 sm:w-[26rem] lg:top-8 lg:right-8" />
			</div>

			{/* Правый нижний угол. На телефоне — снизу во всю ширину */}
			<div className="absolute right-4 bottom-4 left-4 sm:left-auto sm:w-[26rem] lg:right-8 lg:bottom-8">
				{musicEnabled ? <BackgroundMusic /> : <RadioWidget />}
			</div>
		</main>
	);
}
