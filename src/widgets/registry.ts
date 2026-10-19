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
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

import { hasRunningTimer } from './timer/running';

// Загруженная музыка временно скрыта: вместо неё играет радио. Код оставлен, чтобы вернуть её флагом
export const musicEnabled = false;

// Плеер загруженной музыки, отдельным чанком. Пока музыка выключена, импорта нет вовсе —
// иначе сборщик положил бы mp3 (~14 МБ) в dist, даже если плеер нигде не показан
export const BackgroundMusic = musicEnabled
	? lazy(() =>
			import('./music/BackgroundMusic').then((module) => ({ default: module.BackgroundMusic }))
		)
	: null;

// Свойства окна виджета. Положение на экране приходит в className
export type WidgetProps = {
	className?: string;
	// Окно сейчас открыто на панели. Нужно тем, кто не должен работать зря, пока окно закрыто (радио: список станций)
	open?: boolean;
};

// Окно виджета отдельным чанком: грузится, когда его впервые открывают (или заранее, см. preloadWidget).
// После загрузки остаётся смонтированным, как и раньше, — см. App.tsx
function lazyWidget<Name extends string>(
	load: () => Promise<Record<Name, ComponentType<WidgetProps>>>,
	name: Name
) {
	const loadDefault = () => load().then((module) => ({ default: module[name] }));
	return { component: lazy(loadDefault), load: loadDefault };
}

// Группы кнопок на панели. Какая группа в каком углу, задаёт dockPanels в src/widgets/dock/Dock.tsx
export type DockGroupId = 'sound' | 'main' | 'view';

// Столбец, в котором стоит окно с брейкпоинта sm (до xl окно на экране одно, с xl столбцы — сетка, см. App.tsx).
// На телефоне столбцов нет: окна стоят одинаково (windowClass в App.tsx)
export type WidgetColumn = 'left' | 'center' | 'right';

type WidgetDefinition = {
	id: string;
	// Подпись кнопки на панели
	label: string;
	// Клавиша открытия и закрытия окна: event.code, например 'Digit1'. Не должна повторяться (проверяет hotkeys.test.ts)
	hotkey?: string;
	icon: LucideIcon;
	dockGroup: DockGroupId;
	// Окно виджета (React.lazy) и функция, которая подгружает его чанк заранее
	component: LazyExoticComponent<ComponentType<WidgetProps>>;
	load: () => Promise<unknown>;
	// true — окно монтируется сразу при загрузке страницы, даже закрытым: оно что-то делает и без открытия
	// (радио: строка станции под часами и кнопка play у часов; идущий таймер). По умолчанию — при первом открытии
	mountAtStart?: () => boolean;
	column: WidgetColumn;
	// top — окно прижато к верху столбца, bottom — к низу, к панели. Окна столбца не перекрывают друг друга:
	// если им не хватает высоты, окна без shrink-0 сжимаются и прокручиваются внутри
	anchor: 'top' | 'bottom';
	// Ширина и прочие классы окна с брейкпоинта sm. Место на экране задают column и anchor.
	// До xl окно одно на экране, ширина фиксированная (sm:w-[…]). С xl столбцы — сетка: у боковых окно тянется по столбцу
	// и не шире потолка (xl:w-full xl:max-w-[…]): окна не перекрывают друг друга по построению
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
		...lazyWidget(() => import('./radio/RadioWidget'), 'RadioWidget'),
		mountAtStart: () => true,
		column: 'left',
		anchor: 'bottom',
		// Не сжимается: управление радио должно быть видно целиком, прокручиваются звуки над ним
		placement: 'sm:w-[26rem] xl:w-full xl:max-w-[26rem] sm:shrink-0',
		enabled: !musicEnabled
	},
	{
		id: 'ambience',
		hotkey: 'Digit2',
		label: 'Звуки',
		icon: Headphones,
		dockGroup: 'sound',
		...lazyWidget(() => import('./ambience/AmbienceWidget'), 'AmbienceWidget'),
		column: 'left',
		anchor: 'top',
		// Длинный список звуков сжимается до места над радио и прокручивается
		placement: 'sm:w-[26rem] xl:w-full xl:max-w-[26rem]'
	},
	{
		id: 'stats',
		hotkey: 'Digit3',
		label: 'Статистика',
		icon: ChartNoAxesColumn,
		dockGroup: 'main',
		...lazyWidget(() => import('./stats/StatsWidget'), 'StatsWidget'),
		column: 'center',
		anchor: 'top',
		// Той же ширины, что таймер и задачи, поэтому при смене статистики и таймера окно не прыгает.
		placement: 'sm:w-[28rem]',
		slot: 'center-top'
	},
	{
		id: 'timer',
		hotkey: 'Digit4',
		label: 'Таймер',
		icon: Timer,
		dockGroup: 'main',
		...lazyWidget(() => import('./timer/TimerWidget'), 'TimerWidget'),
		// Идущий таймер переживает перезагрузку: сигнал и затихание музыки зависят от окна, даже закрытого
		mountAtStart: hasRunningTimer,
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
		...lazyWidget(() => import('./tasks/TasksWidget'), 'TasksWidget'),
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
		...lazyWidget(() => import('./wallpaper/WallpaperGallery'), 'WallpaperGallery'),
		column: 'right',
		anchor: 'bottom',
		// Галерея не выше 34rem, сетка превью прокручивается внутри
		placement: 'sm:max-h-[34rem] sm:w-[30rem] xl:w-full xl:max-w-[30rem]',
		slot: 'view'
	},
	{
		id: 'youtube',
		hotkey: 'Digit7',
		label: 'YouTube',
		icon: MonitorPlay,
		dockGroup: 'view',
		...lazyWidget(() => import('./youtube/YouTubeWidget'), 'YouTubeWidget'),
		column: 'right',
		anchor: 'bottom',
		// На месте галереи: открывается вместо неё. Подборки прокручиваются внутри
		placement: 'sm:max-h-[34rem] sm:w-[30rem] xl:w-full xl:max-w-[30rem]',
		slot: 'view'
	},
	{
		id: 'twitch',
		hotkey: 'Digit8',
		label: 'Twitch',
		icon: Tv,
		dockGroup: 'view',
		...lazyWidget(() => import('./twitch/TwitchWidget'), 'TwitchWidget'),
		column: 'right',
		anchor: 'bottom',
		// Окно-плеер, а не фон (Twitch не играет под интерфейсом, см. docs/twitch.md). Слот 'view' оставлен ради раскладки:
		// окно открывается вместо галереи в той же колонке справа внизу. Плеер 16:9 держит
		// высоту (shrink-0), при нехватке места прокручивается список каналов. На телефоне окно не выше, чем в windowClass
		// (App.tsx), чтобы не залезать под верхние кнопки
		placement: 'sm:max-h-[36rem] sm:w-[30rem] xl:w-full xl:max-w-[30rem]',
		slot: 'view'
	},
	{
		id: 'effects',
		hotkey: 'Digit9',
		label: 'Эффекты',
		icon: Sparkles,
		dockGroup: 'view',
		...lazyWidget(() => import('./effects/EffectsWidget'), 'EffectsWidget'),
		column: 'right',
		anchor: 'bottom',
		// На месте галереи: открывается вместо неё
		placement: 'sm:w-[30rem] xl:w-full xl:max-w-[30rem]',
		slot: 'view'
	},
	{
		id: 'dimmer',
		hotkey: 'Digit0',
		label: 'Затемнение',
		icon: Contrast,
		dockGroup: 'view',
		...lazyWidget(() => import('./dimmer/DimmerWidget'), 'DimmerWidget'),
		column: 'right',
		anchor: 'bottom',
		// На месте галереи и эффектов: открывается вместо них
		placement: 'sm:w-[22rem] xl:w-full xl:max-w-[22rem]',
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

// Подгружает чанк окна заранее (наведение на кнопку панели, простой браузера), чтобы окно открывалось без паузы
export function preloadWidget(id: WidgetId) {
	return widgets
		.find((widget) => widget.id === id)
		?.load()
		.catch(() => {});
}
