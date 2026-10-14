import { useCallback } from 'react';

import { usePersistentState } from '@/hooks/usePersistentState';
import { storageKeys } from '@/lib/storage';

import {
	addCard,
	emptyBoard,
	moveCard,
	parseBoard,
	removeCard,
	toggleCollapsed,
	type ColumnId
} from './board';

// Доска задач, которая переживает перезагрузку. Вся логика — в board.ts, тут только состояние
export function useBoard() {
	const [board, setBoard] = usePersistentState(storageKeys.tasks, emptyBoard(), parseBoard);

	// Все действия через функциональное обновление: при перетаскивании onDragOver вызывается часто,
	// и каждый вызов должен опираться на самую свежую доску
	const add = useCallback(
		(title: string) => setBoard((current) => addCard(current, title, crypto.randomUUID())),
		[setBoard]
	);
	const remove = useCallback(
		(id: string) => setBoard((current) => removeCard(current, id)),
		[setBoard]
	);
	const move = useCallback(
		(id: string, column: ColumnId, index: number) =>
			setBoard((current) => moveCard(current, id, column, index)),
		[setBoard]
	);
	const toggle = useCallback(
		(column: ColumnId) => setBoard((current) => toggleCollapsed(current, column)),
		[setBoard]
	);

	return { board, add, remove, move, toggleCollapsed: toggle };
}
