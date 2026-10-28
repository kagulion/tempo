import type { ReactNode } from 'react';

import { hotkeyLabel } from '@/widgets/hotkeys/bindings';
import { type DockGroupId, preloadWidget, widgets, type WidgetId } from '@/widgets/registry';

import { ClickSoundsButton } from './ClickSoundsButton';
import { buttonClass, DockBar } from './DockBar';
import { DockClock } from './DockClock';
import { ScenesButton } from './ScenesButton';

type DockGroup = {
	id: DockGroupId;
	label: string;
	// Не окна, а что-то своё после кнопок окон: часы, звуки нажатий, смена сцены
	extra?: ReactNode;
};

export type DockPanel = {
	label: string;
	className: string;
	groups: DockGroup[];
};

// Три панели внизу экрана. Место с брейкпоинта sm задаёт className, на телефоне панели стоят в общем ряду (dockRowClass в App.tsx). Кнопки окон в группах берутся из реестра виджетов (dockGroup в src/widgets/registry.ts)
export const dockPanels: DockPanel[] = [
	// Левый нижний угол, под радио
	{
		label: 'Звук',
		className: 'sm:absolute sm:bottom-4 sm:left-4 lg:bottom-8 lg:left-8',
		groups: [{ id: 'sound', label: 'Звук', extra: <ClickSoundsButton className={buttonClass} /> }]
	},
	// Снизу. От sm до md стоит сразу справа от «Звука» (с отступом около 16px), с md — по центру
	{
		label: 'Главное',
		className: 'sm:absolute sm:bottom-4 sm:left-40 md:left-1/2 md:-translate-x-1/2 lg:bottom-8',
		groups: [
			{
				id: 'main',
				label: 'Главное',
				extra: <DockClock className={buttonClass} />
			}
		]
	},
	// Правый нижний угол, под столбцом обоев, эффектов и затемнения
	{
		label: 'Вид',
		className: 'sm:absolute sm:right-4 sm:bottom-4 lg:right-8 lg:bottom-8',
		groups: [{ id: 'view', label: 'Вид', extra: <ScenesButton className={buttonClass} /> }]
	}
];

type DockProps = {
	panel: DockPanel;
	isOpen: (id: WidgetId) => boolean;
	onToggle: (id: WidgetId) => void;
};

// Панель с кнопками, которые открывают и закрывают окна виджетов. Вид общий с другими страницами (DockBar). В группе «Главное» ещё часы
export function Dock({ panel, isOpen, onToggle }: DockProps) {
	return (
		<DockBar
			label={panel.label}
			className={panel.className}
			groups={panel.groups.map((group) => ({
				id: group.id,
				label: group.label,
				extra: group.extra,
				buttons: widgets
					.filter((widget) => widget.dockGroup === group.id)
					.map((widget) => ({
						id: widget.id,
						label: widget.label,
						icon: widget.icon,
						hotkey: hotkeyLabel(`widget:${widget.id}`),
						pressed: isOpen(widget.id),
						onClick: () => onToggle(widget.id),
						// Чанк окна подгружается заранее: к клику он обычно уже готов
						onPointerEnter: () => preloadWidget(widget.id),
						onFocus: () => preloadWidget(widget.id)
					}))
			}))}
		/>
	);
}
