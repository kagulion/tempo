import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';

import { columnTitles, type Card, type ColumnId } from './board';
import { columnIcons } from './columnIcons';
import { columnDropId } from './dnd';
import { TaskCard } from './TaskCard';

type TaskColumnProps = {
	column: ColumnId;
	cards: Card[];
	collapsed: boolean;
	// С клавиатуры секцию с карточками как место для броска отключаем: иначе стрелка вверх или вниз
	// упирается в саму секцию, а не доходит до соседней. Бросать надо на карточки, пустые и свёрнутые секции
	skipAsDropTarget: boolean;
	onToggle: (column: ColumnId) => void;
	onMove: (id: string, column: ColumnId) => void;
	onRemove: (id: string) => void;
};

// Секция доски: заголовок со счётчиком (клик сворачивает) и список карточек.
// Вся секция — место для броска: пустая и свёрнутая принимают карточку в конец
export function TaskColumn({
	column,
	cards,
	collapsed,
	skipAsDropTarget,
	onToggle,
	onMove,
	onRemove
}: TaskColumnProps) {
	const { setNodeRef, isOver } = useDroppable({
		id: columnDropId(column),
		disabled: skipAsDropTarget && !collapsed && cards.length > 0
	});
	const Icon = columnIcons[column];

	return (
		<section
			ref={setNodeRef}
			aria-label={columnTitles[column]}
			className={cn('flex flex-col rounded-xl transition-colors', isOver && 'bg-white/10')}
		>
			<button
				type="button"
				onClick={() => onToggle(column)}
				aria-expanded={!collapsed}
				className="flex h-8 w-full items-center gap-2 rounded-lg px-1.5 text-left text-sm font-medium text-white/90 transition-colors outline-none hover:bg-white/10 focus-visible:ring-3 focus-visible:ring-white/20"
			>
				<Icon className="size-4 shrink-0" />
				<span className="min-w-0 truncate">{columnTitles[column]}</span>
				<span className="text-xs text-white/80 tabular-nums">{cards.length}</span>
				<ChevronDown
					className={cn(
						'ml-auto size-4 shrink-0 text-white/80 transition-transform',
						collapsed && '-rotate-90'
					)}
				/>
			</button>

			{/* Карточек свёрнутой секции в DOM нет: бросить на неё можно только на заголовок, и карточка встанет в конец */}
			{!collapsed && (
				<SortableContext
					id={column}
					items={cards.map((card) => card.id)}
					strategy={verticalListSortingStrategy}
				>
					{cards.length > 0 ? (
						<div role="list" className="flex flex-col gap-1.5 px-1 pt-1 pb-1.5">
							{cards.map((card) => (
								<TaskCard
									key={card.id}
									card={card}
									column={column}
									onMove={onMove}
									onRemove={onRemove}
								/>
							))}
						</div>
					) : (
						<div className="px-1 pt-1 pb-1.5">
							<p className="rounded-lg border border-dashed border-white/15 py-3 text-center text-xs text-white/80">
								Нет задач
							</p>
						</div>
					)}
				</SortableContext>
			)}
		</section>
	);
}
