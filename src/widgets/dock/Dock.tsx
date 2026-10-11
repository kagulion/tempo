import { ChartNoAxesColumn, Headphones, Image, Radio, Timer, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { DockClock } from './DockClock';
import { FullscreenButton } from './FullscreenButton';
import type { WidgetId } from './useDock';

const buttonClass =
	'flex size-9 items-center justify-center rounded-full text-white/70 transition-colors outline-none hover:bg-white/15 hover:text-white focus-visible:ring-3 focus-visible:ring-white/20';

type DockGroup = {
	label: string;
	items: { id: WidgetId; label: string; icon: LucideIcon }[];
	// Не окна, а что-то своё после кнопок окон: часы, полноэкранный режим
	extra?: ReactNode;
};

const groups: DockGroup[] = [
	{
		label: 'Звук',
		items: [
			{ id: 'radio', label: 'Радио', icon: Radio },
			{ id: 'ambience', label: 'Звуки', icon: Headphones }
		]
	},
	{ label: 'Фокус', items: [{ id: 'timer', label: 'Таймер', icon: Timer }] },
	{ label: 'Вид', items: [{ id: 'wallpaper', label: 'Обои', icon: Image }] },
	{
		label: 'Статистика',
		items: [{ id: 'stats', label: 'Статистика', icon: ChartNoAxesColumn }],
		extra: (
			<>
				<DockClock />
				<FullscreenButton className={buttonClass} />
			</>
		)
	}
];

type DockProps = {
	isOpen: (id: WidgetId) => boolean;
	onToggle: (id: WidgetId) => void;
	className?: string;
};

// Панель внизу экрана: кнопки открывают и закрывают окна виджетов. В группе статистики ещё часы и полный экран
export function Dock({ isOpen, onToggle, className }: DockProps) {
	return (
		<nav aria-label="Виджеты" className={cn('z-20 flex items-end gap-2 sm:gap-4', className)}>
			{groups.map((group) => (
				<div key={group.label} className="flex flex-col items-start gap-1">
					{/* На телефоне подписи групп не помещаются */}
					<span className="hidden px-2 text-xs font-medium text-white/80 drop-shadow sm:block">
						{group.label}
					</span>
					<div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/50 p-1 shadow-2xl backdrop-blur-md">
						{group.items.map((item) => {
							const Icon = item.icon;
							const open = isOpen(item.id);
							return (
								<button
									key={item.id}
									type="button"
									onClick={() => onToggle(item.id)}
									aria-pressed={open}
									title={item.label}
									aria-label={item.label}
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
