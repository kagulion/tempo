import { cn } from '@/lib/utils';
import { Dock, dockPanels } from '@/widgets/dock/Dock';
import { useDock } from '@/widgets/dock/useDock';
import { EffectLayers } from '@/widgets/effects/EffectLayers';
import { BackgroundMusic } from '@/widgets/music/BackgroundMusic';
import { musicEnabled, widgets, type WidgetColumn, type WidgetEntry } from '@/widgets/registry';
import { WallpaperBackground } from '@/widgets/wallpaper/WallpaperBackground';

// На телефоне окно занимает ширину экрана над панелью, а если не влезает по высоте — прокручивается.
// С sm окно стоит в своём столбце: не выше столбца, может сжаться (min-h-0) и прокручиваться внутри.
// Столбец не ловит клики, а окно — ловит
const windowClass =
	'absolute inset-x-4 bottom-[4.5rem] max-h-[calc(100dvh-5.5rem)] scrollbar-glass overflow-y-auto sm:pointer-events-auto sm:static sm:max-h-full sm:min-h-0';

// Столбцы с компьютера: от верхнего края до панели. Окна с anchor: 'top' прижаты к верху (mb-auto),
// остальные — к низу, к кнопкам панели, даже когда верхнее окно закрыто. Окна в столбце не наезжают друг на друга.
// На телефоне столбцов нет (contents): окна встают по общему windowClass.
// Сам столбец не ловит клики, иначе перекрыл бы фон между окнами
const columnClass =
	'contents sm:pointer-events-none sm:absolute sm:top-4 sm:bottom-24 sm:flex sm:flex-col sm:justify-end sm:gap-4 lg:top-8 lg:bottom-28';

const columns: { id: WidgetColumn; className: string }[] = [
	{ id: 'left', className: 'sm:left-4 sm:items-start lg:left-8' },
	{ id: 'center', className: 'sm:left-1/2 sm:-translate-x-1/2 sm:items-center' },
	{ id: 'right', className: 'sm:right-4 sm:items-end lg:right-8' }
];

// Окна столбца сверху вниз: сначала прижатые к верху, внутри — в порядке реестра
function columnWidgets(column: WidgetColumn) {
	const inColumn = widgets.filter((widget) => widget.column === column);
	return [
		...inColumn.filter((widget) => widget.anchor === 'top'),
		...inColumn.filter((widget) => widget.anchor === 'bottom')
	];
}

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
					widget.anchor === 'top' && 'sm:mb-auto',
					widget.placement,
					!dock.isOpen(widget.id) && 'hidden'
				)}
			/>
		);
	}

	return (
		<main className="relative h-screen w-screen overflow-hidden bg-black text-white">
			<WallpaperBackground />
			<EffectLayers />

			{columns.map((column) => (
				<div key={column.id} className={cn(columnClass, column.className)}>
					{columnWidgets(column.id).map(renderWindow)}
				</div>
			))}
			{musicEnabled && <BackgroundMusic />}

			{dockPanels.map((panel) => (
				<Dock key={panel.label} panel={panel} isOpen={dock.isOpen} onToggle={dock.toggle} />
			))}
		</main>
	);
}
