// Логика доски задач без React: добавление, перенос, удаление карточек и разбор сохранённого.
// Состояние и сохранение — в useBoard.ts. Тесты — в board.test.ts

import { isRecord } from '@/lib/storage';

export type ColumnId = 'todo' | 'doing' | 'done';

export type Card = { id: string; title: string };

// Порядок карточек в массиве — их порядок в секции сверху вниз
export type Board = {
	version: 1;
	columns: Record<ColumnId, Card[]>;
	// Свёрнутые секции: в них видны только заголовок и счётчик
	collapsed: ColumnId[];
};

// Секции слева направо (в окне — сверху вниз)
export const columnIds: readonly ColumnId[] = ['todo', 'doing', 'done'];

export const columnTitles: Record<ColumnId, string> = {
	todo: 'Сделать',
	doing: 'В работе',
	done: 'Готово'
};

export const maxTitleLength = 200;

// «Готово» свёрнута сразу: сделанное нужно реже, чем то, что ещё предстоит
export function emptyBoard(): Board {
	return { version: 1, columns: { todo: [], doing: [], done: [] }, collapsed: ['done'] };
}

export function isColumnId(value: unknown): value is ColumnId {
	return columnIds.some((id) => id === value);
}

// Название без пробелов по краям и не длиннее лимита. Пустая строка — карточки нет
function cleanTitle(title: string) {
	return title.trim().slice(0, maxTitleLength).trim();
}

export function findCard(board: Board, id: string) {
	for (const column of columnIds) {
		const index = board.columns[column].findIndex((card) => card.id === id);
		if (index !== -1) return { column, index, card: board.columns[column][index] };
	}
	return null;
}

// Новая карточка встаёт в конец «Сделать». Слишком длинное название обрезается, а не отбрасывается:
// лучше сохранить начало мысли, чем молча потерять ввод. id приходит снаружи, чтобы функция была детерминированной
export function addCard(board: Board, title: string, id: string): Board {
	const cleaned = cleanTitle(title);
	if (!cleaned || findCard(board, id)) return board;
	return {
		...board,
		columns: { ...board.columns, todo: [...board.columns.todo, { id, title: cleaned }] }
	};
}

export function removeCard(board: Board, id: string): Board {
	const found = findCard(board, id);
	if (!found) return board;
	return {
		...board,
		columns: {
			...board.columns,
			[found.column]: board.columns[found.column].filter((card) => card.id !== id)
		}
	};
}

// Переносит карточку в секцию на позицию toIndex. Индекс считается уже без самой карточки,
// то есть это то место, которое карточка займёт в итоге; лишнее обрезается до края (так «в конец» — любое большое число).
// Подходит и для перестановки внутри секции, и для переноса между секциями
export function moveCard(board: Board, id: string, toColumn: ColumnId, toIndex: number): Board {
	const found = findCard(board, id);
	if (!found) return board;

	const target = board.columns[toColumn].filter((card) => card.id !== id);
	const index = Math.min(
		Math.max(Number.isNaN(toIndex) ? target.length : Math.trunc(toIndex), 0),
		target.length
	);
	if (found.column === toColumn && found.index === index) return board;

	target.splice(index, 0, found.card);
	return {
		...board,
		columns: {
			...board.columns,
			// Секция-источник без карточки (при переносе внутри секции она же и есть target)
			[found.column]: board.columns[found.column].filter((card) => card.id !== id),
			[toColumn]: target
		}
	};
}

export function toggleCollapsed(board: Board, column: ColumnId): Board {
	return {
		...board,
		collapsed: board.collapsed.includes(column)
			? board.collapsed.filter((id) => id !== column)
			: [...board.collapsed, column]
	};
}

// Читает сохранённую доску. Испорченные карточки отбрасываются по одной, а не вся доска:
// одна кривая запись не должна стоить посетителю всех задач. Лишние поля и секции игнорируются.
// Карточка с id, который уже встретился (в этой или другой секции), остаётся только первый раз
export function parseBoard(saved: unknown): Board | undefined {
	if (!isRecord(saved)) return undefined;

	const board = emptyBoard();
	const savedColumns = isRecord(saved.columns) ? saved.columns : {};
	const seen = new Set<string>();

	for (const column of columnIds) {
		const list = savedColumns[column];
		if (!Array.isArray(list)) continue;
		for (const item of list) {
			if (!isRecord(item) || typeof item.id !== 'string' || typeof item.title !== 'string')
				continue;
			const title = cleanTitle(item.title);
			if (!item.id || !title || seen.has(item.id)) continue;
			seen.add(item.id);
			board.columns[column].push({ id: item.id, title });
		}
	}

	if (Array.isArray(saved.collapsed)) {
		board.collapsed = columnIds.filter((column) => (saved.collapsed as unknown[]).includes(column));
	}
	return board;
}
