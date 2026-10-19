import { Suspense, useEffect, useRef, useState } from 'react';

import { Logo } from '@/components/Logo';
import { Toaster } from '@/components/ui/toast';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useHotkeys } from '@/hooks/useHotkeys';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { installClickSounds, clickSoundsStore } from '@/lib/clickSound';
import { toggleSoundMuted } from '@/lib/soundMute';
import { mediaQueries } from '@/lib/media';
import { whenIdle } from '@/lib/idle';
import { cn } from '@/lib/utils';
import { Widget } from '@/widgets/Widget';
import { useBigClock } from '@/widgets/clock/useBigClock';
import { BigClock } from '@/widgets/clock/BigClock';
import { DimmerLayer } from '@/widgets/dimmer/DimmerLayer';
import { Dock, dockPanels } from '@/widgets/dock/Dock';
import { FullscreenButton, toggleFullscreen } from '@/widgets/dock/FullscreenButton';
import { QuietButtons } from '@/widgets/dock/QuietButtons';
import { onOpenWidgetRequest } from '@/widgets/dock/openRequests';
import { mountWidget, useMountedWidgets } from '@/widgets/dock/mountedWidgets';
import { useDock } from '@/widgets/dock/useDock';
import { EffectLayers } from '@/widgets/effects/EffectLayers';
import { toggleEffectsOff } from '@/widgets/effects/effectsOff';
import { focusVisibility } from '@/widgets/focus/focus';
import { FocusButton } from '@/widgets/focus/FocusButton';
import { useFocusMode } from '@/widgets/focus/useFocusMode';
import { hotkeyBindings } from '@/widgets/hotkeys/bindings';
import { HotkeysButton, HotkeysDialog } from '@/widgets/hotkeys/HotkeysDialog';
import {
	BackgroundMusic,
	preloadWidget,
	widgets,
	type WidgetColumn,
	type WidgetEntry,
	type WidgetId
} from '@/widgets/registry';
import { ScenesDialog } from '@/widgets/onboarding/ScenesDialog';
import { openScenes } from '@/widgets/onboarding/scenesReopen';
import { useOnboarding } from '@/widgets/onboarding/useOnboarding';
import { StatsHighlights } from '@/widgets/stats/StatsHighlights';
import { keepOnlineRunning } from '@/widgets/stats/useOnline';
import { keepVisitStatsRunning } from '@/widgets/stats/useVisitStats';
import { WallpaperBackground } from '@/widgets/wallpaper/WallpaperBackground';

// На телефоне окно занимает ширину экрана над панелью, а если не влезает по высоте — прокручивается.
// С sm окно стоит в своём столбце: не выше столбца, может сжаться (min-h-0) и прокручиваться внутри.
// Столбец не ловит клики, а окно — ловит
const windowClass =
	'absolute inset-x-4 bottom-[15rem] max-h-[calc(100dvh-20rem)] scrollbar-glass overflow-y-auto sm:pointer-events-auto sm:static sm:max-h-full sm:min-h-0';

// Столбцы с компьютера: от верхнего края до панели. Окна с anchor: 'top' прижаты к верху (mb-auto),
// остальные — к низу, к кнопкам панели, даже когда верхнее окно закрыто. Окна в столбце не наезжают друг на друга.
// На телефоне столбцов нет (contents): окна встают по общему windowClass.
// Сам столбец не ловит клики, иначе перекрыл бы фон между окнами.
// У столбца свой z-10 (над крупными часами): transform у центрального столбца создаёт слой,
// и без z-index окна внутри него оказывались бы под часами
const columnClass =
	'contents sm:pointer-events-none sm:absolute sm:z-10 sm:top-4 sm:bottom-24 sm:flex sm:flex-col sm:justify-end sm:gap-4 lg:top-8 lg:bottom-28';

// Панели внизу. На телефоне — столбик у левого края: панели стоят друг под другом, подписи групп слева.
// С sm ряда нет (contents): каждая панель стоит в своём углу (className в dockPanels).
// Промежутки между панелями не ловят клики
const dockRowClass =
	'pointer-events-none absolute inset-x-4 bottom-4 flex flex-col items-start gap-2 *:pointer-events-auto sm:contents';

const columns: { id: WidgetColumn; className: string }[] = [
	// Начинается ниже логотипа в левом верхнем углу
	{ id: 'left', className: 'sm:top-16 sm:left-4 sm:items-start lg:top-24 lg:left-8' },
	// С sm до lg начинается ниже ряда кнопок в правом верхнем углу: на узком экране таймер иначе уходит под них.
	// С lg кнопки в углу короче окна и стоят правее, столбец снова от верха
	{ id: 'center', className: 'sm:top-16 sm:left-1/2 sm:-translate-x-1/2 sm:items-center lg:top-8' },
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

// Раскладка страницы: фон, эффекты, крупные часы, кнопки звука, эффектов, фокуса и полного экрана, окна виджетов и панель. Список окон и их места — в src/widgets/registry.ts
export default function App() {
	const dock = useDock();
	const focus = useFocusMode();
	// В фокусе окна и панели только прячутся (hidden), список открытых окон в useDock не трогаем
	const visibility = focusVisibility(focus.mode);
	const bigClock = useBigClock();
	const [helpOpen, setHelpOpen] = useState(false);
	const closeHelp = () => setHelpOpen(false);
	const onboarding = useOnboarding();
	// Клавиатуры на телефоне нет: кнопку со списком клавиш прячем
	const touchOnly = useMediaQuery(mediaQueries.coarsePointer);

	// Окна открывает не только панель, но и тосты (кнопка «Открыть»): они присылают просьбу через openRequests
	const dockRef = useRef(dock);
	useEffect(() => {
		dockRef.current = dock;
	});
	useEffect(
		() =>
			onOpenWidgetRequest((id) => {
				if (!dockRef.current.isOpen(id)) dockRef.current.toggle(id);
			}),
		[]
	);

	// Окно монтируется при первом открытии и остаётся в странице (см. mountedWidgets.ts)
	const mounted = useMountedWidgets();
	const openIds = widgets.filter((widget) => dock.isOpen(widget.id)).map((widget) => widget.id);
	const openKey = openIds.join();
	useEffect(() => {
		openIds.forEach(mountWidget);
		// oxlint-disable-next-line react-hooks/exhaustive-deps
	}, [openKey]);

	// Чанки остальных окон подгружаем заранее, по одному в простое и не сразу после загрузки: первой отрисовке они не мешают,
	// а окно потом открывается без паузы
	useEffect(() => {
		let cancelCurrent = () => {};
		let cancelled = false;
		const queue = widgets.map((widget) => widget.id);
		function next(delay: number) {
			const id = queue.shift();
			if (id === undefined || cancelled) return;
			cancelCurrent = whenIdle(() => {
				preloadWidget(id)?.then(() => next(500));
			}, delay);
		}
		next(4000);
		return () => {
			cancelled = true;
			cancelCurrent();
		};
	}, []);

	// Учёт времени, серии дней и присутствия в онлайне идёт всегда, а не только пока показано окно статистики
	useEffect(() => keepVisitStatsRunning(), []);
	useEffect(() => keepOnlineRunning(), []);

	// Тихие тики при нажатии кнопок, слушатель один на весь документ
	useEffect(() => installClickSounds(), []);

	useHotkeys(hotkeyBindings, (action) => {
		// Пока открыты сцены, клавиши сайта молчат (Esc обрабатывает сама карточка)
		if (onboarding.visible) return;
		if (action === 'help') return setHelpOpen((open) => !open);
		// Пока открыт список клавиш, остальные клавиши ждут
		if (helpOpen) return;
		if (action === 'scenes') return openScenes();
		if (action === 'clickSounds') return clickSoundsStore.set((enabled) => !enabled);
		// Звук и эффекты переключаются и в фокусе: их кнопки в углу видны всегда
		if (action === 'soundMuted') return toggleSoundMuted();
		if (action === 'effectsOff') return toggleEffectsOff();
		if (action === 'focus') return focus.toggle();
		if (action === 'fullscreen') return document.fullscreenEnabled ? toggleFullscreen() : undefined;
		// В фокусе окна и панель спрятаны, их клавиши не работают
		if (focus.mode !== 'off') return;
		if (action === 'bigClock') return bigClock.toggle();
		if (action.startsWith('widget:')) dock.toggle(action.slice('widget:'.length) as WidgetId);
	});
	// Свёрнутые часы стоят первым элементом центрального столбца, над статистикой. Если сверху нет видимого окна, которое
	// само прижато к верху (mb-auto), часы прижимаем сами, иначе столбец (justify-end) спустит их вниз
	const cornerClockClass = columnWidgets('center').some(
		(widget) => widget.anchor === 'top' && dock.isOpen(widget.id) && visibility.windows
	)
		? undefined
		: 'sm:mb-auto';

	// Закрытые окна не размонтируем, а прячем: радио, звуки и таймер продолжают работать.
	// Окно, которое ещё ни разу не открывали, не монтируем вовсе: его чанк не грузится
	function renderWindow(widget: WidgetEntry) {
		const open = dock.isOpen(widget.id);
		if (!open && !mounted.has(widget.id)) return null;
		const Component = widget.component;
		const className = cn(
			windowClass,
			// Анимация появления — в src/index.css
			'widget-window',
			widget.anchor === 'top' && 'sm:mb-auto',
			widget.placement,
			(!open || !visibility.windows) && 'hidden'
		);
		return (
			// Пока грузится чанк, на месте окна стоит пустая стеклянная заготовка того же размера и положения
			<Suspense
				key={widget.id}
				fallback={<Widget aria-busy="true" className={cn(className, 'min-h-24')} />}
			>
				<Component className={className} open={open} />
			</Suspense>
		);
	}

	return (
		<TooltipProvider>
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
				{/* В фокусе логотипа нет: страница остаётся чистой */}
				{focus.mode === 'off' && <Logo className="absolute top-4 left-4 z-20 lg:top-8 lg:left-8" />}
				<div className="absolute top-4 right-4 z-20 flex items-center gap-2 lg:top-8 lg:right-8">
					{/* С xl: уже, при 1024 с оценкой настроения, пилюля наезжает на окно статистики в центральном столбце. В фокусе её нет */}
					{focus.mode === 'off' && <StatsHighlights className="hidden xl:flex" />}
					{/* Без звука и без эффектов: видны и в фокусе, чтобы выключить всё, не выходя из него */}
					<QuietButtons />
					<FocusButton mode={focus.mode} onToggle={focus.toggle} onHideAll={focus.enterHideAll} />
					{!touchOnly && <HotkeysButton onClick={() => setHelpOpen(true)} />}
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
				<HotkeysDialog open={helpOpen} onClose={closeHelp} />
				<ScenesDialog open={onboarding.visible} onFinish={onboarding.finish} />
			</main>
			{/* Уведомления (src/components/ui/toast.tsx): один раз на всю страницу */}
			<Toaster />
		</TooltipProvider>
	);
}
