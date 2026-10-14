// Мелочи перетаскивания карточек: id секций как мест для броска и выбор того, над чем сейчас карточка.
// Сами переносы считает board.ts, тут только распознавание цели

import {
	closestCenter,
	pointerWithin,
	rectIntersection,
	type CollisionDetection,
	type UniqueIdentifier
} from '@dnd-kit/core';

import { isColumnId, type ColumnId } from './board';

const prefix = 'column:';

// Секция сама является местом для броска (пустая или свёрнутая). Префикс не даёт ей совпасть с id карточки
export function columnDropId(column: ColumnId) {
	return `${prefix}${column}`;
}

// Секция по id места для броска; null — это карточка
export function columnOfDropId(id: UniqueIdentifier): ColumnId | null {
	const text = String(id);
	if (!text.startsWith(prefix)) return null;
	const column = text.slice(prefix.length);
	return isColumnId(column) ? column : null;
}

// Над чем карточка: над другой карточкой — над ней; над секцией, но не над карточкой (зазор, пустое место) —
// над ближайшей карточкой этой секции, иначе любой бросок в зазор отправлял бы карточку в конец;
// над секцией без карточек (пустой или свёрнутой) — над самой секцией.
// С клавиатуры указателя нет, поэтому там смотрим на пересечение прямоугольников
export const collisionDetection: CollisionDetection = (args) => {
	const hits = args.pointerCoordinates ? pointerWithin(args) : rectIntersection(args);

	const card = hits.find((hit) => columnOfDropId(hit.id) === null);
	if (card) return [card];

	const section = hits[0];
	if (!section) return [];
	const column = columnOfDropId(section.id);

	const cardsOfColumn = args.droppableContainers.filter(
		(container) => container.data.current?.sortable?.containerId === column
	);
	if (cardsOfColumn.length === 0) return [section];
	return closestCenter({ ...args, droppableContainers: cardsOfColumn }).slice(0, 1);
};
