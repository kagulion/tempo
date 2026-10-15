import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { type DockGroupId, widgets, type WidgetId } from '@/widgets/registry';

import { DockClock } from './DockClock';

const buttonClass =
	'flex size-9 items-center justify-center rounded-full text-white/70 transition-colors outline-none hover:bg-white/15 hover:text-white focus-visible:ring-3 focus-visible:ring-white/20';

type DockGroup = {
	id: DockGroupId;
	label: string;
	// Не окна, а что-то своё после кнопок окон: часы
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
		groups: [{ id: 'sound', label: 'Звук' }]
	},
	// Снизу по центру
	{
		label: 'Главное',
		className: 'sm:absolute sm:bottom-4 sm:left-1/2 sm:-translate-x-1/2 lg:bottom-8',
		groups: [
			{
				id: 'main',
				label: 'Главное',
				extra: <DockClock className={buttonClass} />
			}
		]
	},
	// Правый нижний угол, под столбцом таймера и обоев. Группа focus подписана «Таймеры», чтобы не путать с кнопкой фокус-режима
	{
		label: 'Вид и таймеры',
		className: 'sm:absolute sm:right-4 sm:bottom-4 lg:right-8 lg:bottom-8',
		groups: [
			{ id: 'view', label: 'Вид' },
			{ id: 'focus', label: 'Таймеры' }
		]
	}
];

type DockProps = {
	panel: DockPanel;
	isOpen: (id: WidgetId) => boolean;
	onToggle: (id: WidgetId) => void;
};

// Панель с кнопками, которые открывают и закрывают окна виджетов. В группе «Главное» ещё часы
export function Dock({ panel, isOpen, onToggle }: DockProps) {
	return (
		<nav
			aria-label={panel.label}
			className={cn('z-20 flex items-end gap-2 sm:gap-4', panel.className)}
		>
			{panel.groups.map((group) => (
				<div key={group.id} className="flex flex-col items-start gap-1">
					{/* На телефоне подписи групп не помещаются */}
					<span className="hidden px-2 text-xs font-medium text-white/80 drop-shadow sm:block">
						{group.label}
					</span>
					<div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/50 p-1 shadow-2xl backdrop-blur-md">
						{widgets
							.filter((widget) => widget.dockGroup === group.id)
							.map((widget) => {
								const Icon = widget.icon;
								const open = isOpen(widget.id);
								return (
									<button
										key={widget.id}
										type="button"
										onClick={() => onToggle(widget.id)}
										aria-pressed={open}
										title={widget.label}
										aria-label={widget.label}
										className={cn(buttonClass, open && 'bg-white/20 text-white')}
									>
										<Icon className="size-4" />
									</button>
								);
							})}
						{group.extra}
					</div>
				</div>
			))}
		</nav>
	);
}
