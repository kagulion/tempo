import {
	ChartNoAxesColumn,
	Headphones,
	Image,
	Radio,
	Sparkles,
	Timer,
	type LucideIcon
} from 'lucide-react';
import type { ComponentType } from 'react';

import { AmbienceWidget } from './ambience/AmbienceWidget';
import { EffectsWidget } from './effects/EffectsWidget';
import { RadioWidget } from './radio/RadioWidget';
import { StatsWidget } from './stats/StatsWidget';
import { TimerWidget } from './timer/TimerWidget';
import { WallpaperGallery } from './wallpaper/WallpaperGallery';

// Загруженная музыка временно скрыта: вместо неё играет радио. Код оставлен, чтобы вернуть её флагом
export const musicEnabled = false;

// Группы кнопок на панели. Какая группа в каком углу, задаёт dockPanels в src/widgets/dock/Dock.tsx
export type DockGroupId = 'sound' | 'stats' | 'view' | 'focus';

type WidgetDefinition = {
	id: string;
	// Подпись кнопки на панели
	label: string;
	icon: LucideIcon;
	dockGroup: DockGroupId;
	// Окно виджета. Положение на экране приходит в className
	component: ComponentType<{ className?: string }>;
	// Классы положения окна с брейкпоинта sm. На телефоне все окна стоят одинаково (windowClass в App.tsx)
	placement: string;
	// right — окно в правом столбце: окна в нём встают друг под другом в порядке этого списка (rightColumnClass в App.tsx)
	column?: 'right';
	// Окна с одинаковым slot стоят на одном месте: открытие одного закрывает остальные
	slot?: string;
	// false — виджета нет на странице: ни окна, ни кнопки
	enabled?: boolean;
};

// Все окна виджетов. Порядок здесь — порядок кнопок внутри группы на панели и окон в столбце
const definitions = [
	{
		id: 'radio',
		label: 'Радио',
		icon: Radio,
		dockGroup: 'sound',
		component: RadioWidget,
		placement: 'sm:bottom-24 sm:left-4 sm:w-[26rem] lg:bottom-28 lg:left-8',
		enabled: !musicEnabled
	},
	{
		id: 'ambience',
		label: 'Звуки',
		icon: Headphones,
		dockGroup: 'sound',
		component: AmbienceWidget,
		// Под звуками в том же левом столбце стоит радио (~8.5rem над панелью), поэтому высота звуков ограничена сильнее, а лишнее прокручивается
		placement:
			'sm:top-4 sm:bottom-auto sm:left-4 sm:max-h-[calc(100dvh-16.5rem)] sm:w-[22rem] lg:top-8 lg:left-8 lg:max-h-[calc(100dvh-18.5rem)]'
	},
	{
		id: 'stats',
		label: 'Статистика',
		icon: ChartNoAxesColumn,
		dockGroup: 'stats',
		component: StatsWidget,
		// Между звуками и таймером: свободно по ширине от ~1200px, на более узких экранах может перекрыть соседей
		placement: 'sm:top-4 sm:bottom-auto sm:left-1/2 sm:w-[18rem] sm:-translate-x-1/2 lg:top-8'
	},
	{
		id: 'timer',
		label: 'Таймер',
		icon: Timer,
		dockGroup: 'focus',
		component: TimerWidget,
		// Таймер и обои стоят в правом столбце и не перекрывают друг друга, поэтому здесь только ширина.
		// mb-auto уводит таймер к верху, остальные окна столбца прижаты к низу
		placement: 'sm:mb-auto sm:w-[26rem] sm:shrink-0',
		column: 'right'
	},
	{
		id: 'wallpaper',
		label: 'Обои',
		icon: Image,
		dockGroup: 'view',
		component: WallpaperGallery,
		// Галерея не выше 34rem, сетка превью прокручивается внутри. На компьютере сжимается до места под таймером
		placement:
			'max-h-[min(34rem,calc(100dvh-5.5rem))] sm:max-h-[34rem] sm:min-h-0 sm:w-[30rem] lg:max-h-[34rem]',
		column: 'right',
		slot: 'view'
	},
	{
		id: 'effects',
		label: 'Эффекты',
		icon: Sparkles,
		dockGroup: 'view',
		component: EffectsWidget,
		// На месте галереи: открывается вместо неё
		placement: 'sm:w-[30rem]',
		column: 'right',
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
