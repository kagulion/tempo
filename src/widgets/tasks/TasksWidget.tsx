import {
	DndContext,
	DragOverlay,
	KeyboardSensor,
	PointerSensor,
	TouchSensor,
	useSensor,
	useSensors,
	type Announcements,
	type DragEndEvent,
	type DragOverEvent,
	type DragStartEvent,
	type UniqueIdentifier
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { useRef, useState, type SubmitEvent } from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Widget, WidgetHeader } from '@/widgets/Widget';

import { columnIds, columnTitles, findCard, maxTitleLength, type ColumnId } from './board';
import { collisionDetection, columnOfDropId } from './dnd';
import { TaskCardOverlay } from './TaskCard';
import { TaskColumn } from './TaskColumn';
import { useBoard } from './useBoard';

// Индекс «в конец секции»: moveCard обрезает его до длины списка
const toEnd = Number.POSITIVE_INFINITY;

type TasksWidgetProps = {
	className?: string;
};

export function TasksWidget({ className }: TasksWidgetProps) {
	const { board, add, remove, move, toggleCollapsed } = useBoard();
	const [draft, setDraft] = useState('');
	const [activeId, setActiveId] = useState<string | null>(null);
	const [byKeyboard, setByKeyboard] = useState(false);
	// Где карточка стояла до перетаскивания: по Esc возвращаем её туда, ведь по пути она могла сменить секцию
	const origin = useRef<{ column: ColumnId; index: number } | null>(null);

	const sensors = useSensors(
		// Пока курсор не прошёл 5px, это обычный клик: кнопки внутри карточки работают
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
		// Перетаскивание с телефона начинается после удержания: иначе список нельзя было бы прокрутить пальцем
		useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	const activeCard = activeId ? findCard(board, activeId)?.card : undefined;

	function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!draft.trim()) return;
		add(draft);
		setDraft('');
	}

	// Где окажется карточка, если бросить её на over: секция и место в ней (null — в конец)
	function targetOf(overId: UniqueIdentifier) {
		const column = columnOfDropId(overId);
		if (column) return { column, index: null };
		const found = findCard(board, String(overId));
		return found && { column: found.column, index: found.index };
	}

	function handleDragStart({ active, activatorEvent }: DragStartEvent) {
		setByKeyboard(activatorEvent instanceof KeyboardEvent);
		const id = String(active.id);
		const found = findCard(board, id);
		origin.current = found && { column: found.column, index: found.index };
		setActiveId(id);
	}

	// Между секциями карточку переносим уже на лету, чтобы в новой секции остальные расступились.
	// Внутри секции их двигает сам SortableContext, а итог фиксируем в конце
	function handleDragOver({ active, over }: DragOverEvent) {
		if (!over) return;
		const id = String(active.id);
		const from = findCard(board, id);
		const target = targetOf(over.id);
		if (!from || !target || target.column === from.column) return;
		// Из свёрнутой секции карточка пропала бы из DOM прямо под курсором: переносим её только по броску
		if (board.collapsed.includes(target.column)) return;

		let index = toEnd;
		if (target.index !== null) {
			// Ниже середины карточки под курсором — встаём после неё
			const moved = active.rect.current.translated;
			const below = moved && moved.top + moved.height / 2 > over.rect.top + over.rect.height / 2;
			index = target.index + (below ? 1 : 0);
		}
		move(id, target.column, index);
	}

	function handleDragEnd({ active, over }: DragEndEvent) {
		setActiveId(null);
		origin.current = null;
		if (!over) return;
		const id = String(active.id);
		const from = findCard(board, id);
		const target = targetOf(over.id);
		if (!from || !target) return;
		// Бросок на свою секцию мимо карточек (пустое место) ничего не меняет
		if (target.index === null && target.column === from.column) return;
		move(id, target.column, target.index ?? toEnd);
	}

	function handleDragCancel() {
		if (activeId && origin.current) move(activeId, origin.current.column, origin.current.index);
		setActiveId(null);
		origin.current = null;
	}

	const titleOf = (id: UniqueIdentifier) => findCard(board, String(id))?.card.title ?? '';
	const placeOf = (id: UniqueIdentifier) => {
		const target = targetOf(id);
		return target ? columnTitles[target.column] : '';
	};
	const announcements: Announcements = {
		onDragStart: ({ active }) => `Задача «${titleOf(active.id)}» взята`,
		onDragOver: ({ active, over }) =>
			over ? `Задача «${titleOf(active.id)}» над секцией «${placeOf(over.id)}»` : undefined,
		onDragEnd: ({ active, over }) =>
			over
				? `Задача «${titleOf(active.id)}» перенесена в секцию «${placeOf(over.id)}»`
				: `Задача «${titleOf(active.id)}» оставлена на месте`,
		onDragCancel: ({ active }) => `Перенос задачи «${titleOf(active.id)}» отменён`
	};

	return (
		<Widget aria-label="Задачи" className={cn('flex flex-col gap-3 p-4', className)}>
			<WidgetHeader title="Задачи" />

			<form onSubmit={handleSubmit} className="flex items-center gap-1.5">
				<Input
					variant="glass"
					value={draft}
					onChange={(event) => setDraft(event.target.value)}
					maxLength={maxTitleLength}
					placeholder="Добавить задачу…"
					aria-label="Новая задача"
					autoComplete="off"
				/>
				<Button type="submit" variant="glass" size="icon" disabled={!draft.trim()} hint="Добавить">
					<Plus />
				</Button>
			</form>

			<DndContext
				sensors={sensors}
				collisionDetection={collisionDetection}
				onDragStart={handleDragStart}
				onDragOver={handleDragOver}
				onDragEnd={handleDragEnd}
				onDragCancel={handleDragCancel}
				accessibility={{
					announcements,
					screenReaderInstructions: {
						draggable:
							'Чтобы взять задачу, нажмите пробел. Стрелками выберите место, пробелом бросьте, Esc отменяет перенос.'
					}
				}}
			>
				{/* Прокручивается только список секций, поле ввода остаётся наверху */}
				<div className="-mx-1 flex min-h-0 flex-1 scrollbar-glass flex-col gap-1 overflow-y-auto px-1">
					{columnIds.map((column) => (
						<TaskColumn
							key={column}
							column={column}
							cards={board.columns[column]}
							collapsed={board.collapsed.includes(column)}
							skipAsDropTarget={byKeyboard}
							onToggle={toggleCollapsed}
							onMove={(id, to) => move(id, to, toEnd)}
							onRemove={remove}
						/>
					))}
				</div>

				{/* В body: у окна есть backdrop-filter, из-за него fixed внутри считался бы от окна, а не от экрана */}
				{createPortal(
					<DragOverlay>{activeCard && <TaskCardOverlay card={activeCard} />}</DragOverlay>,
					document.body
				)}
			</DndContext>
		</Widget>
	);
}
