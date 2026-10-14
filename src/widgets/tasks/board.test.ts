import { describe, expect, it } from 'vitest';

import {
	addCard,
	emptyBoard,
	maxTitleLength,
	moveCard,
	parseBoard,
	removeCard,
	toggleCollapsed,
	type Board,
	type Card,
	type ColumnId
} from './board';

function card(id: string): Card {
	return { id, title: `Задача ${id}` };
}

function board(
	columns: Partial<Record<ColumnId, string[]>> = {},
	collapsed: ColumnId[] = []
): Board {
	return {
		version: 1,
		columns: {
			todo: (columns.todo ?? []).map(card),
			doing: (columns.doing ?? []).map(card),
			done: (columns.done ?? []).map(card)
		},
		collapsed
	};
}

// Порядок id по секциям, чтобы в тестах сравнивать коротко
function ids(current: Board) {
	return {
		todo: current.columns.todo.map((item) => item.id),
		doing: current.columns.doing.map((item) => item.id),
		done: current.columns.done.map((item) => item.id)
	};
}

describe('emptyBoard', () => {
	it('пустая доска со свёрнутой секцией «Готово»', () => {
		expect(emptyBoard()).toEqual(board({}, ['done']));
	});
});

describe('addCard', () => {
	it('кладёт карточку в конец «Сделать»', () => {
		const next = addCard(board({ todo: ['a'] }), 'Купить хлеб', 'b');
		expect(next.columns.todo).toEqual([card('a'), { id: 'b', title: 'Купить хлеб' }]);
	});

	it('обрезает пробелы по краям названия', () => {
		expect(addCard(emptyBoard(), '  Позвонить  ', 'a').columns.todo[0].title).toBe('Позвонить');
	});

	it('пустое и состоящее из пробелов название не добавляет', () => {
		const current = emptyBoard();
		expect(addCard(current, '', 'a')).toBe(current);
		expect(addCard(current, '   \n ', 'a')).toBe(current);
	});

	it('длинное название обрезает до лимита', () => {
		const next = addCard(emptyBoard(), 'я'.repeat(maxTitleLength + 50), 'a');
		expect(next.columns.todo[0].title).toBe('я'.repeat(maxTitleLength));
	});

	it('карточку с занятым id не добавляет', () => {
		const current = board({ done: ['a'] });
		expect(addCard(current, 'Ещё одна', 'a')).toBe(current);
	});

	it('не меняет исходную доску', () => {
		const current = emptyBoard();
		addCard(current, 'Задача', 'a');
		expect(current.columns.todo).toEqual([]);
	});
});

describe('removeCard', () => {
	it('удаляет карточку из любой секции и сохраняет порядок остальных', () => {
		const next = removeCard(board({ todo: ['a', 'b', 'c'], doing: ['d'] }), 'b');
		expect(ids(next)).toEqual({ todo: ['a', 'c'], doing: ['d'], done: [] });
		expect(ids(removeCard(next, 'd')).doing).toEqual([]);
	});

	it('несуществующий id оставляет доску как есть', () => {
		const current = board({ todo: ['a'] });
		expect(removeCard(current, 'zzz')).toBe(current);
	});
});

describe('moveCard', () => {
	it('переносит в пустую секцию', () => {
		const next = moveCard(board({ todo: ['a', 'b'] }), 'a', 'doing', 0);
		expect(ids(next)).toEqual({ todo: ['b'], doing: ['a'], done: [] });
	});

	it('переносит в начало другой секции', () => {
		const next = moveCard(board({ todo: ['a'], doing: ['x', 'y'] }), 'a', 'doing', 0);
		expect(ids(next).doing).toEqual(['a', 'x', 'y']);
	});

	it('переносит в середину другой секции', () => {
		const next = moveCard(board({ todo: ['a'], doing: ['x', 'y'] }), 'a', 'doing', 1);
		expect(ids(next).doing).toEqual(['x', 'a', 'y']);
	});

	it('переносит в конец другой секции, в том числе по слишком большому индексу', () => {
		const current = board({ todo: ['a'], doing: ['x', 'y'] });
		expect(ids(moveCard(current, 'a', 'doing', 2)).doing).toEqual(['x', 'y', 'a']);
		expect(ids(moveCard(current, 'a', 'doing', Infinity)).doing).toEqual(['x', 'y', 'a']);
		expect(ids(moveCard(current, 'a', 'doing', 99)).doing).toEqual(['x', 'y', 'a']);
	});

	it('отрицательный индекс считает началом', () => {
		const next = moveCard(board({ todo: ['a'], doing: ['x'] }), 'a', 'doing', -3);
		expect(ids(next).doing).toEqual(['a', 'x']);
	});

	it('переставляет внутри секции вниз и вверх', () => {
		const current = board({ todo: ['a', 'b', 'c'] });
		expect(ids(moveCard(current, 'a', 'todo', 2)).todo).toEqual(['b', 'c', 'a']);
		expect(ids(moveCard(current, 'c', 'todo', 0)).todo).toEqual(['c', 'a', 'b']);
		expect(ids(moveCard(current, 'a', 'todo', 1)).todo).toEqual(['b', 'a', 'c']);
	});

	it('на то же место — доска не меняется', () => {
		const current = board({ todo: ['a', 'b', 'c'] });
		expect(moveCard(current, 'b', 'todo', 1)).toBe(current);
		expect(moveCard(current, 'c', 'todo', 99)).toBe(current);
	});

	it('несуществующий id оставляет доску как есть', () => {
		const current = board({ todo: ['a'] });
		expect(moveCard(current, 'zzz', 'done', 0)).toBe(current);
	});

	it('не теряет и не размножает карточки', () => {
		const next = moveCard(board({ todo: ['a', 'b'], doing: ['c'], done: ['d'] }), 'b', 'done', 0);
		expect(ids(next)).toEqual({ todo: ['a'], doing: ['c'], done: ['b', 'd'] });
	});

	it('не меняет свёрнутость и исходную доску', () => {
		const current = board({ todo: ['a'] }, ['done']);
		const next = moveCard(current, 'a', 'done', 0);
		expect(next.collapsed).toEqual(['done']);
		expect(ids(current).todo).toEqual(['a']);
	});
});

describe('toggleCollapsed', () => {
	it('сворачивает и разворачивает секцию', () => {
		const collapsed = toggleCollapsed(board({}, ['done']), 'todo');
		expect(collapsed.collapsed).toEqual(['done', 'todo']);
		expect(toggleCollapsed(collapsed, 'done').collapsed).toEqual(['todo']);
	});
});

describe('parseBoard', () => {
	it('читает то, что сохранила сама доска', () => {
		const saved = board({ todo: ['a', 'b'], doing: ['c'] }, ['done', 'doing']);
		expect(parseBoard(JSON.parse(JSON.stringify(saved)))).toEqual({
			...saved,
			collapsed: ['doing', 'done']
		});
	});

	it('не объект — undefined', () => {
		for (const saved of [null, undefined, 'доска', 42, true, [], [card('a')]]) {
			expect(parseBoard(saved)).toBeUndefined();
		}
	});

	it('объект без секций — пустая доска', () => {
		expect(parseBoard({})).toEqual(emptyBoard());
		expect(parseBoard({ columns: 'нет' })).toEqual(emptyBoard());
	});

	it('испорченные карточки отбрасывает по одной', () => {
		const parsed = parseBoard({
			columns: {
				todo: [
					card('a'),
					null,
					'строка',
					{ id: 'b' },
					{ title: 'Без id' },
					{ id: 5, title: 'x' },
					card('c')
				],
				doing: [{ id: '', title: 'Пустой id' }, { id: 'd', title: '   ' }, card('e')],
				done: 'не массив'
			}
		});
		expect(parsed && ids(parsed)).toEqual({ todo: ['a', 'c'], doing: ['e'], done: [] });
	});

	it('дубликат id в двух секциях оставляет один раз, в первой', () => {
		const parsed = parseBoard({
			columns: { todo: [card('a'), card('a')], doing: [card('a'), card('b')], done: [card('b')] }
		});
		expect(parsed && ids(parsed)).toEqual({ todo: ['a'], doing: ['b'], done: [] });
	});

	it('неизвестные секции и поля игнорирует', () => {
		const parsed = parseBoard({
			version: 7,
			extra: true,
			columns: { todo: [{ id: 'a', title: 'Задача', color: 'red' }], archive: [card('z')] },
			collapsed: ['archive', 'todo', 5]
		});
		expect(parsed).toEqual({
			version: 1,
			columns: { todo: [{ id: 'a', title: 'Задача' }], doing: [], done: [] },
			collapsed: ['todo']
		});
	});

	it('без списка свёрнутых секций сворачивает «Готово»', () => {
		expect(parseBoard({ columns: {} })?.collapsed).toEqual(['done']);
		expect(parseBoard({ columns: {}, collapsed: [] })?.collapsed).toEqual([]);
	});

	it('слишком длинное название обрезает', () => {
		const parsed = parseBoard({ columns: { todo: [{ id: 'a', title: 'я'.repeat(500) }] } });
		expect(parsed?.columns.todo[0].title).toHaveLength(maxTitleLength);
	});
});
