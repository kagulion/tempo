import { Suspense } from 'react';

import { cn } from '@/lib/utils';
import { BigClock } from '@/widgets/clock/BigClock';
import { DimmerLayer } from '@/widgets/dimmer/DimmerLayer';
import { Dock, dockPanels } from '@/widgets/dock/Dock';
import { FullscreenButton } from '@/widgets/dock/FullscreenButton';
import { useDock } from '@/widgets/dock/useDock';
import { EffectLayers } from '@/widgets/effects/EffectLayers';
import { focusVisibility } from '@/widgets/focus/focus';
import { FocusButton } from '@/widgets/focus/FocusButton';
import { useFocusMode } from '@/widgets/focus/useFocusMode';
import { BackgroundMusic, widgets, type WidgetColumn, type WidgetEntry } from '@/widgets/registry';
import { StatsHighlights } from '@/widgets/stats/StatsHighlights';
import { WallpaperBackground } from '@/widgets/wallpaper/WallpaperBackground';

// На телефоне окно занимает ширину экрана над панелью, а если не влезает по высоте — прокручивается.
// С sm окно стоит в своём столбце: не выше столбца, может сжаться (min-h-0) и прокручиваться внутри.
// Столбец не ловит клики, а окно — ловит
const windowClass =
	'absolute inset-x-4 bottom-[4.5rem] max-h-[calc(100dvh-8rem)] scrollbar-glass overflow-y-auto sm:pointer-events-auto sm:static sm:max-h-full sm:min-h-0';

// Столбцы с компьютера: от верхнего края до панели. Окна с anchor: 'top' прижаты к верху (mb-auto),
// остальные — к низу, к кнопкам панели, даже когда верхнее окно закрыто. Окна в столбце не наезжают друг на друга.
// На телефоне столбцов нет (contents): окна встают по общему windowClass.
// Сам столбец не ловит клики, иначе перекрыл бы фон между окнами.
// У столбца свой z-10 (над крупными часами): transform у центрального столбца создаёт слой,
// и без z-index окна внутри него оказывались бы под часами
const columnClass =
	'contents sm:pointer-events-none sm:absolute sm:z-10 sm:top-4 sm:bottom-24 sm:flex sm:flex-col sm:justify-end sm:gap-4 lg:top-8 lg:bottom-28';

// Панели внизу. На телефоне — один ряд во всю ширину с равными промежутками между панелями.
// С sm ряда нет (contents): каждая панель стоит в своём углу (className в dockPanels).
// Промежутки между панелями не ловят клики
const dockRowClass =
	'pointer-events-none absolute inset-x-4 bottom-4 flex items-end justify-between *:pointer-events-auto sm:contents';

const columns: { id: WidgetColumn; className: string }[] = [
	{ id: 'left', className: 'sm:left-4 sm:items-start lg:left-8' },
	{ id: 'center', className: 'sm:left-1/2 sm:-translate-x-1/2 sm:items-center' },
	// Начинается ниже кнопки полного экрана в правом верхнем углу
	{ id: 'right', className: 'sm:top-16 sm:right-4 sm:items-end lg:top-20 lg:right-8' }
];

// Окна столбца сверху вниз: сначала прижатые к верху, внутри — в порядке реестра
function columnWidgets(column: WidgetColumn) {
	const inColumn = widgets.filter((widget) => widget.column === column);
	return [
		...inColumn.filter((widget) => widget.anchor === 'top'),
		...inColumn.filter((widget) => widget.anchor === 'bottom')
	];
}

// Раскладка страницы: фон, эффекты, крупные часы, кнопки фокуса и полного экрана, окна виджетов и панель. Список окон и их места — в src/widgets/registry.ts
export default function App() {
	const dock = useDock();
	const focus = useFocusMode();
	// В фокусе окна и панели только прячутся (hidden), список открытых окон в useDock не трогаем
	const visibility = focusVisibility(focus.mode);
	// Свёрнутые часы стоят первым элементом центрального столбца, над статистикой. Если сверху нет видимого окна, которое
	// само прижато к верху (mb-auto), часы прижимаем сами, иначе столбец (justify-end) спустит их вниз
	const cornerClockClass = columnWidgets('center').some(
		(widget) => widget.anchor === 'top' && dock.isOpen(widget.id) && visibility.windows
	)
		? undefined
		: 'sm:mb-auto';

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
					(!dock.isOpen(widget.id) || !visibility.windows) && 'hidden'
				)}
			/>
		);
	}

	return (
		<main className="relative h-screen w-screen overflow-hidden bg-black text-white">
			<WallpaperBackground />
			{/* Затемнение только обоев: эффекты, часы и окна выше */}
			<DimmerLayer />
			<EffectLayers />
			{/* Центральные часы: слой на весь экран. свёрнутые стоят наверху центрального столбца ниже */}
			<BigClock visibility={visibility.bigClock} variant="center" />
			{/* В фокусе клик по свободному экрану (и по крупным часам) возвращает всё обратно. Ниже кнопок (z-20) */}
			{focus.mode !== 'off' && (
				<div aria-hidden="true" className="absolute inset-0 z-[15]" onClick={focus.exit} />
			)}
			<div className="absolute top-4 right-4 z-20 flex items-center gap-2 lg:top-8 lg:right-8">
				{/* С xl: уже, при 1024 с оценкой настроения, пилюля наезжает на окно статистики в центральном столбце. В фокусе её нет */}
				{focus.mode === 'off' && <StatsHighlights className="hidden xl:flex" />}
				<FocusButton mode={focus.mode} onToggle={focus.toggle} onHideAll={focus.enterHideAll} />
				<FullscreenButton />
			</div>

			{columns.map((column) => (
				<div
					key={column.id}
					// В фокусе окна скрыты, а столбец остаётся ради свёрнутых часов: поднимаем его над
					// слоем кликов (z-15), чтобы кнопка в строке станции нажималась
					className={cn(columnClass, focus.mode !== 'off' && 'sm:z-[16]', column.className)}
				>
					{column.id === 'center' && (
						<BigClock
							visibility={visibility.bigClock}
							variant="corner"
							className={cornerClockClass}
						/>
					)}
					{columnWidgets(column.id).map(renderWindow)}
				</div>
			))}
			{BackgroundMusic && (
				<Suspense>
					<BackgroundMusic />
				</Suspense>
			)}

			<div className={cn(dockRowClass, !visibility.dock && 'hidden sm:hidden')}>
				{dockPanels.map((panel) => (
					<Dock key={panel.label} panel={panel} isOpen={dock.isOpen} onToggle={dock.toggle} />
				))}
			</div>
		</main>
	);
}
