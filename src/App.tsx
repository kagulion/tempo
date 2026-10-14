import { cn } from '@/lib/utils';
import { AmbienceWidget } from '@/widgets/ambience/AmbienceWidget';
import { centerGroups, Dock, leftGroups, rightGroups } from '@/widgets/dock/Dock';
import { useDock, type WidgetId } from '@/widgets/dock/useDock';
import { EffectCanvas } from '@/widgets/effects/EffectCanvas';
import { effects } from '@/widgets/effects/effects';
import { EffectsWidget } from '@/widgets/effects/EffectsWidget';
import { useActiveEffects } from '@/widgets/effects/useActiveEffects';
import { BackgroundMusic } from '@/widgets/music/BackgroundMusic';
import { RadioWidget } from '@/widgets/radio/RadioWidget';
import { StatsWidget } from '@/widgets/stats/StatsWidget';
import { TimerWidget } from '@/widgets/timer/TimerWidget';
import { useWallpaper } from '@/widgets/wallpaper/useWallpaper';
import { WallpaperBackground } from '@/widgets/wallpaper/WallpaperBackground';
import { WallpaperGallery } from '@/widgets/wallpaper/WallpaperGallery';

// Загруженная музыка временно скрыта: вместо неё играет радио. Код оставлен, чтобы вернуть её флагом
const musicEnabled = false;

// На телефоне окно занимает ширину экрана над панелью, а если не влезает по высоте — прокручивается.
// С sm каждое окно встаёт в свой угол, нижние — над панелью
const windowClass =
	'absolute inset-x-4 bottom-[4.5rem] max-h-[calc(100dvh-5.5rem)] overflow-y-auto [scrollbar-color:rgb(255_255_255/0.2)_transparent] [scrollbar-width:thin] sm:inset-x-auto sm:max-h-[calc(100dvh-7rem)] lg:max-h-[calc(100dvh-9rem)]';

// Правый столбец с компьютера: обои прижаты к низу, к кнопкам «Вид» и «Фокус», даже когда таймер закрыт; таймер mb-auto уводит к верху.
// Если обоим не хватает высоты, галерея сжимается, а не наезжает на таймер.
// На телефоне столбца нет (contents): окна встают по общему windowClass.
// Сам столбец не ловит клики, иначе перекрыл бы фон между окнами
const rightColumnClass =
	'contents sm:pointer-events-none sm:absolute sm:top-4 sm:right-4 sm:bottom-24 sm:flex sm:flex-col sm:items-end sm:justify-end sm:gap-4 lg:top-8 lg:right-8 lg:bottom-28';
const rightColumnWindowClass = 'sm:pointer-events-auto sm:static';

const windowPlacement: Record<WidgetId, string> = {
	// Под звуками в том же левом столбце стоит радио (~8.5rem над панелью), поэтому высота звуков ограничена сильнее, а лишнее прокручивается
	ambience:
		'sm:top-4 sm:bottom-auto sm:left-4 sm:max-h-[calc(100dvh-16.5rem)] sm:w-[22rem] lg:top-8 lg:left-8 lg:max-h-[calc(100dvh-18.5rem)]',
	// Таймер и обои стоят в правом столбце (rightColumnClass) и не перекрывают друг друга, поэтому здесь только ширина
	timer: 'sm:mb-auto sm:w-[26rem] sm:shrink-0',
	// Между звуками и таймером: свободно по ширине от ~1200px, на более узких экранах может перекрыть соседей
	stats: 'sm:top-4 sm:bottom-auto sm:left-1/2 sm:w-[18rem] sm:-translate-x-1/2 lg:top-8',
	// Галерея не выше 34rem, сетка превью прокручивается внутри. На компьютере сжимается до места под таймером
	wallpaper:
		'max-h-[min(34rem,calc(100dvh-5.5rem))] sm:max-h-[34rem] sm:min-h-0 sm:w-[30rem] lg:max-h-[34rem]',
	// На месте галереи: открывается вместо неё (sharedSlots в useDock)
	effects: 'sm:w-[30rem]',
	radio: 'sm:bottom-24 sm:left-4 sm:w-[26rem] lg:bottom-28 lg:left-8'
};

// Раскладка страницы: фон, панель и окна виджетов. Логика каждого виджета — в src/widgets/
export default function App() {
	const wallpaper = useWallpaper();
	const dock = useDock();
	const activeEffects = useActiveEffects();

	// Закрытые окна не размонтируем, а прячем: радио, звуки и таймер продолжают работать
	function placement(id: WidgetId) {
		return cn(windowClass, windowPlacement[id], !dock.isOpen(id) && 'hidden');
	}

	return (
		<main className="relative h-screen w-screen overflow-hidden bg-black text-white">
			<WallpaperBackground wallpaper={wallpaper.current} />
			{/* Эффекты не перехватывают клики. Слой (поверх окон или под ними) задаёт сам эффект */}
			{effects
				.filter((effect) => activeEffects.isActive(effect.id))
				.map((effect) => (
					<EffectCanvas
						key={effect.id}
						create={effect.create}
						layer={effect.layer}
						paused={activeEffects.paused}
					/>
				))}

			<AmbienceWidget className={placement('ambience')} />
			<StatsWidget className={placement('stats')} />
			<div className={rightColumnClass}>
				<TimerWidget className={cn(placement('timer'), rightColumnWindowClass)} />
				<WallpaperGallery
					currentId={wallpaper.current.id}
					onSelect={wallpaper.select}
					className={cn(placement('wallpaper'), rightColumnWindowClass)}
				/>
				<EffectsWidget
					isActive={activeEffects.isActive}
					onToggle={activeEffects.toggle}
					anyActive={activeEffects.anyActive}
					playing={activeEffects.playing}
					onTogglePaused={activeEffects.togglePaused}
					onReset={activeEffects.reset}
					className={cn(placement('effects'), rightColumnWindowClass)}
				/>
			</div>
			{musicEnabled ? <BackgroundMusic /> : <RadioWidget className={placement('radio')} />}

			<Dock
				groups={leftGroups}
				label="Звук"
				isOpen={dock.isOpen}
				onToggle={dock.toggle}
				className="absolute bottom-4 left-4 lg:bottom-8 lg:left-8"
			/>
			<Dock
				groups={centerGroups}
				label="Статистика"
				isOpen={dock.isOpen}
				onToggle={dock.toggle}
				className="absolute bottom-4 left-1/2 -translate-x-1/2 lg:bottom-8"
			/>
			<Dock
				groups={rightGroups}
				label="Вид и фокус"
				isOpen={dock.isOpen}
				onToggle={dock.toggle}
				className="absolute right-4 bottom-4 lg:right-8 lg:bottom-8"
			/>
		</main>
	);
}
