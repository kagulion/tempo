import {
	ChartNoAxesColumn,
	Contrast,
	Headphones,
	Image,
	MonitorPlay,
	Radio,
	Sparkles,
	SquareKanban,
	Timer,
	Tv,
	type LucideIcon
} from 'lucide-react';
import { lazy, type ComponentType } from 'react';

import { AmbienceWidget } from './ambience/AmbienceWidget';
import { DimmerWidget } from './dimmer/DimmerWidget';
import { EffectsWidget } from './effects/EffectsWidget';
import { RadioWidget } from './radio/RadioWidget';
import { StatsWidget } from './stats/StatsWidget';
import { TasksWidget } from './tasks/TasksWidget';
import { TimerWidget } from './timer/TimerWidget';
import { RutubeWidget } from './rutube/RutubeWidget';
import { WallpaperGallery } from './wallpaper/WallpaperGallery';
import { YouTubeWidget } from './youtube/YouTubeWidget';

// Загруженная музыка временно скрыта: вместо неё играет радио. Код оставлен, чтобы вернуть её флагом
export const musicEnabled = false;

// Плеер загруженной музыки, отдельным чанком. Пока музыка выключена, импорта нет вовсе —
// иначе сборщик положил бы mp3 (~14 МБ) в dist, даже если плеер нигде не показан
export const BackgroundMusic = musicEnabled
	? lazy(() =>
			import('./music/BackgroundMusic').then((module) => ({ default: module.BackgroundMusic }))
		)
	: null;

// Группы кнопок на панели. Какая группа в каком углу, задаёт dockPanels в src/widgets/dock/Dock.tsx
export type DockGroupId = 'sound' | 'main' | 'view';

// Столбец, в котором стоит окно с брейкпоинта sm. На телефоне столбцов нет: окна стоят одинаково (windowClass в App.tsx)
export type WidgetColumn = 'left' | 'center' | 'right';

type WidgetDefinition = {
	id: string;
	// Подпись кнопки на панели
	label: string;
	// Клавиша открытия и закрытия окна: event.code, например 'Digit1'. Не должна повторяться (проверяет hotkeys.test.ts)
	hotkey?: string;
	icon: LucideIcon;
	dockGroup: DockGroupId;
	// Окно виджета. Положение на экране приходит в className
	component: ComponentType<{ className?: string }>;
	column: WidgetColumn;
	// top — окно прижато к верху столбца, bottom — к низу, к панели. Окна столбца не перекрывают друг друга:
	// если им не хватает высоты, окна без shrink-0 сжимаются и прокручиваются внутри
	anchor: 'top' | 'bottom';
	// Ширина и прочие классы окна с брейкпоинта sm. Место на экране задают column и anchor
	placement: string;
	// Окна с одинаковым slot стоят на одном месте: открытие одного закрывает остальные
	slot?: string;
	// false — виджета нет на странице: ни окна, ни кнопки
	enabled?: boolean;
};

// Все окна виджетов. Порядок здесь — порядок кнопок внутри группы на панели и окон в столбце (сверху вниз внутри anchor)
const definitions = [
	{
		id: 'radio',
		hotkey: 'Digit1',
		label: 'Радио',
		icon: Radio,
		dockGroup: 'sound',
		component: RadioWidget,
		column: 'left',
		anchor: 'bottom',
		// Не сжимается: управление радио должно быть видно целиком, прокручиваются звуки над ним
		placement: 'sm:w-[26rem] sm:shrink-0',
		enabled: !musicEnabled
	},
	{
		id: 'ambience',
		hotkey: 'Digit2',
		label: 'Звуки',
		icon: Headphones,
		dockGroup: 'sound',
		component: AmbienceWidget,
		column: 'left',
		anchor: 'top',
		// Длинный список звуков сжимается до места над радио и прокручивается
		placement: 'sm:w-[26rem]'
	},
	{
		id: 'stats',
		hotkey: 'Digit3',
		label: 'Статистика',
		icon: ChartNoAxesColumn,
		dockGroup: 'main',
		component: StatsWidget,
		column: 'center',
		anchor: 'top',
		// Той же ширины, что таймер и задачи, поэтому при смене статистики и таймера окно не прыгает.
		// Между звуками и окнами справа: на узких экранах может перекрыть соседей
		placement: 'sm:w-[28rem]',
		slot: 'center-top'
	},
	{
		id: 'timer',
		hotkey: 'Digit4',
		label: 'Таймер',
		icon: Timer,
		dockGroup: 'main',
		component: TimerWidget,
		column: 'center',
		anchor: 'top',
		// На месте статистики: открывается вместо неё. Не сжимается: при нехватке высоты сжимаются задачи под ним
		placement: 'sm:w-[28rem] sm:shrink-0',
		slot: 'center-top'
	},
	{
		id: 'tasks',
		hotkey: 'Digit5',
		label: 'Задачи',
		icon: SquareKanban,
		dockGroup: 'main',
		component: TasksWidget,
		column: 'center',
		anchor: 'bottom',
		// Под статистикой, у панели. Не shrink-0: при нехватке высоты сжимается и список секций прокручивается внутри
		placement: 'sm:w-[28rem]'
	},
	{
		id: 'wallpaper',
		hotkey: 'Digit6',
		label: 'Обои',
		icon: Image,
		dockGroup: 'view',
		component: WallpaperGallery,
		column: 'right',
		anchor: 'bottom',
		// Галерея не выше 34rem, сетка превью прокручивается внутри
		placement: 'max-h-[min(34rem,calc(100dvh-11rem))] sm:max-h-[34rem] sm:w-[30rem]',
		slot: 'view'
	},
	{
		id: 'youtube',
		hotkey: 'Digit7',
		label: 'YouTube',
		icon: MonitorPlay,
		dockGroup: 'view',
		component: YouTubeWidget,
		column: 'right',
		anchor: 'bottom',
		// На месте галереи: открывается вместо неё. Подборки прокручиваются внутри
		placement: 'max-h-[min(34rem,calc(100dvh-11rem))] sm:max-h-[34rem] sm:w-[30rem]',
		slot: 'view'
	},
	{
		id: 'rutube',
		hotkey: 'Digit8',
		label: 'Rutube',
		icon: Tv,
		dockGroup: 'view',
		component: RutubeWidget,
		column: 'right',
		anchor: 'bottom',
		// На месте галереи: открывается вместо неё. Эфиры прокручиваются внутри
		placement: 'max-h-[min(34rem,calc(100dvh-11rem))] sm:max-h-[34rem] sm:w-[30rem]',
		slot: 'view'
	},
	{
		id: 'effects',
		hotkey: 'Digit9',
		label: 'Эффекты',
		icon: Sparkles,
		dockGroup: 'view',
		component: EffectsWidget,
		column: 'right',
		anchor: 'bottom',
		// На месте галереи: открывается вместо неё
		placement: 'sm:w-[30rem]',
		slot: 'view'
	},
	{
		id: 'dimmer',
		hotkey: 'Digit0',
		label: 'Затемнение',
		icon: Contrast,
		dockGroup: 'view',
		component: DimmerWidget,
		column: 'right',
		anchor: 'bottom',
		// На месте галереи и эффектов: открывается вместо них
		placement: 'sm:w-[22rem]',
		slot: 'view'
	}
] as const satisfies readonly WidgetDefinition[];

export type WidgetId = (typeof definitions)[number]['id'];

export type WidgetEntry = WidgetDefinition & { id: WidgetId };

const allWidgets: readonly WidgetEntry[] = definitions;

export const widgets = allWidgets.filter((widget) => widget.enabled !== false);

export function isWidgetId(value: unknown): value is WidgetId {
	return widgets.some((widget) => widget.id === value);
}
