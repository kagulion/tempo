import { cn } from '@/lib/utils';
import { AmbienceWidget } from '@/widgets/ambience/AmbienceWidget';
import { Dock } from '@/widgets/dock/Dock';
import { useDock, type WidgetId } from '@/widgets/dock/useDock';
import { BackgroundMusic } from '@/widgets/music/BackgroundMusic';
import { RadioWidget } from '@/widgets/radio/RadioWidget';
import { TimerWidget } from '@/widgets/timer/TimerWidget';
import { useWallpaper } from '@/widgets/wallpaper/useWallpaper';
import { WallpaperSwitcher } from '@/widgets/wallpaper/WallpaperSwitcher';

// Загруженная музыка временно скрыта: вместо неё играет радио. Код оставлен, чтобы вернуть её флагом
const musicEnabled = false;

// На телефоне окно занимает ширину экрана над панелью, а если не влезает по высоте — прокручивается.
// С sm каждое окно встаёт в свой угол, нижние — над панелью
const windowClass =
	'absolute inset-x-4 bottom-[4.5rem] max-h-[calc(100dvh-5.5rem)] overflow-y-auto [scrollbar-color:rgb(255_255_255/0.2)_transparent] [scrollbar-width:thin] sm:inset-x-auto sm:max-h-[calc(100dvh-7rem)] lg:max-h-[calc(100dvh-9rem)]';

const windowPlacement: Record<WidgetId, string> = {
	ambience:
		'sm:top-4 sm:bottom-auto sm:left-4 sm:max-h-[calc(100dvh-15rem)] sm:w-[22rem] lg:top-8 lg:left-8 lg:max-h-[calc(100dvh-17rem)]',
	timer: 'sm:top-4 sm:right-4 sm:bottom-auto sm:w-[26rem] lg:top-8 lg:right-8',
	wallpaper: 'sm:bottom-24 sm:left-4 lg:bottom-28 lg:left-8',
	radio: 'sm:right-4 sm:bottom-24 sm:w-[26rem] lg:right-8 lg:bottom-28'
};

// Раскладка страницы: фон, панель и окна виджетов. Логика каждого виджета — в src/widgets/
export default function App() {
	const wallpaper = useWallpaper();
	const dock = useDock();

	// Закрытые окна не размонтируем, а прячем: радио, звуки и таймер продолжают работать
	function placement(id: WidgetId) {
		return cn(windowClass, windowPlacement[id], !dock.isOpen(id) && 'hidden');
	}

	return (
		<main className="relative h-screen w-screen overflow-hidden bg-black text-white">
			{/* Фоновое изображение */}
			<img
				src={wallpaper.current.url}
				alt={wallpaper.current.title}
				className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out"
			/>

			<AmbienceWidget className={placement('ambience')} />
			<TimerWidget className={placement('timer')} />
			<WallpaperSwitcher
				faction={wallpaper.faction}
				index={wallpaper.index}
				count={wallpaper.count}
				onFactionChange={wallpaper.setFaction}
				onPrev={wallpaper.prev}
				onNext={wallpaper.next}
				className={placement('wallpaper')}
			/>
			{musicEnabled ? <BackgroundMusic /> : <RadioWidget className={placement('radio')} />}

			<Dock
				isOpen={dock.isOpen}
				onToggle={dock.toggle}
				className="absolute bottom-4 left-1/2 -translate-x-1/2 lg:bottom-8"
			/>
		</main>
	);
}
