import { cn } from '@/lib/utils';
import { Dock, dockPanels } from '@/widgets/dock/Dock';
import { useDock } from '@/widgets/dock/useDock';
import { EffectLayers } from '@/widgets/effects/EffectLayers';
import { BackgroundMusic } from '@/widgets/music/BackgroundMusic';
import { musicEnabled, widgets, type WidgetEntry } from '@/widgets/registry';
import { WallpaperBackground } from '@/widgets/wallpaper/WallpaperBackground';

// На телефоне окно занимает ширину экрана над панелью, а если не влезает по высоте — прокручивается.
// С sm каждое окно встаёт на своё место (placement в src/widgets/registry.ts), нижние — над панелью
const windowClass =
	'absolute inset-x-4 bottom-[4.5rem] max-h-[calc(100dvh-5.5rem)] scrollbar-glass overflow-y-auto sm:inset-x-auto sm:max-h-[calc(100dvh-7rem)] lg:max-h-[calc(100dvh-9rem)]';

// Правый столбец с компьютера: обои прижаты к низу, к кнопкам «Вид» и «Фокус», даже когда таймер закрыт; таймер mb-auto уводит к верху.
// Если обоим не хватает высоты, галерея сжимается, а не наезжает на таймер.
// На телефоне столбца нет (contents): окна встают по общему windowClass.
// Сам столбец не ловит клики, иначе перекрыл бы фон между окнами
const rightColumnClass =
	'contents sm:pointer-events-none sm:absolute sm:top-4 sm:right-4 sm:bottom-24 sm:flex sm:flex-col sm:items-end sm:justify-end sm:gap-4 lg:top-8 lg:right-8 lg:bottom-28';
const rightColumnWindowClass = 'sm:pointer-events-auto sm:static';

// Раскладка страницы: фон, эффекты, окна виджетов и панель. Список окон и их места — в src/widgets/registry.ts
export default function App() {
	const dock = useDock();

	// Закрытые окна не размонтируем, а прячем: радио, звуки и таймер продолжают работать
	function renderWindow(widget: WidgetEntry) {
		const Component = widget.component;
		return (
			<Component
				key={widget.id}
				className={cn(
					windowClass,
					widget.placement,
					widget.column === 'right' && rightColumnWindowClass,
					!dock.isOpen(widget.id) && 'hidden'
				)}
			/>
		);
	}

	return (
		<main className="relative h-screen w-screen overflow-hidden bg-black text-white">
			<WallpaperBackground />
			<EffectLayers />

			{widgets.filter((widget) => !widget.column).map(renderWindow)}
			<div className={rightColumnClass}>
				{widgets.filter((widget) => widget.column === 'right').map(renderWindow)}
			</div>
			{musicEnabled && <BackgroundMusic />}

			{dockPanels.map((panel) => (
				<Dock key={panel.label} panel={panel} isOpen={dock.isOpen} onToggle={dock.toggle} />
			))}
		</main>
	);
}
