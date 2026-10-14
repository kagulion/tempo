import { useSortable } from '@dnd-kit/sortable';
import { EllipsisVertical, Trash2 } from 'lucide-react';
import { useCallback, type PointerEvent, type TouchEvent } from 'react';

import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import { columnIds, columnTitles, type Card, type ColumnId } from './board';
import { columnIcons } from './columnIcons';

// Нажатие на кнопку меню или на само меню не должно начинать перетаскивание карточки:
// меню лежит внутри карточки (в React-дереве — и его попап), и события иначе всплыли бы до её обработчиков dnd-kit
function keepOutOfDrag(event: PointerEvent | TouchEvent) {
	event.stopPropagation();
}

const cardClass =
	'flex items-start gap-1 rounded-lg border border-white/10 bg-white/10 py-1.5 pr-1.5 pl-2.5 text-sm select-none';

type TaskCardProps = {
	card: Card;
	column: ColumnId;
	onMove: (id: string, column: ColumnId) => void;
	onRemove: (id: string) => void;
};

// Карточка в секции: перетаскивается за любое место, всё остальное — через меню справа
export function TaskCard({ card, column, onMove, onRemove }: TaskCardProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		setActivatorNodeRef,
		transform,
		transition,
		isDragging
	} = useSortable({ id: card.id });

	// Сама карточка и узел, с которого начинается перетаскивание, — один элемент. Так Enter или пробел
	// на кнопке меню не начинают перетаскивание с клавиатуры: dnd-kit берёт только нажатия на этом узле
	const setRefs = useCallback(
		(node: HTMLDivElement | null) => {
			setNodeRef(node);
			setActivatorNodeRef(node);
		},
		[setNodeRef, setActivatorNodeRef]
	);

	return (
		<div
			ref={setRefs}
			{...attributes}
			role="listitem"
			{...listeners}
			style={{
				transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
				transition
			}}
			className={cn(
				cardClass,
				'cursor-grab outline-none focus-visible:ring-3 focus-visible:ring-white/20 active:cursor-grabbing',
				// Оригинал остаётся на месте полупрозрачным, пока копия летит за курсором
				isDragging && 'opacity-40'
			)}
		>
			<p className="min-w-0 flex-1 py-px break-words">{card.title}</p>

			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button
							variant="glass"
							size="icon-xs"
							aria-label={`Действия: ${card.title}`}
							title="Действия"
							onPointerDown={keepOutOfDrag}
							onTouchStart={keepOutOfDrag}
						/>
					}
				>
					<EllipsisVertical />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" onPointerDown={keepOutOfDrag} onTouchStart={keepOutOfDrag}>
					<DropdownMenuGroup>
						{columnIds
							.filter((id) => id !== column)
							.map((id) => {
								const Icon = columnIcons[id];
								return (
									<DropdownMenuItem key={id} onClick={() => onMove(card.id, id)}>
										<Icon />
										Перенести в «{columnTitles[id]}»
									</DropdownMenuItem>
								);
							})}
					</DropdownMenuGroup>
					<DropdownMenuSeparator className="bg-white/10" />
					<DropdownMenuGroup>
						<DropdownMenuItem variant="destructive" onClick={() => onRemove(card.id)}>
							<Trash2 />
							Удалить
						</DropdownMenuItem>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}

// Копия карточки, которая летит за курсором (DragOverlay): без меню и без сортировки
export function TaskCardOverlay({ card }: { card: Card }) {
	return (
		<div
			className={cn(
				cardClass,
				'cursor-grabbing border-white/20 bg-neutral-900/90 text-white shadow-2xl backdrop-blur-md'
			)}
		>
			<p className="min-w-0 flex-1 py-px break-words">{card.title}</p>
			<span className="flex size-6 shrink-0 items-center justify-center text-white/80">
				<EllipsisVertical className="size-3" />
			</span>
		</div>
	);
}
