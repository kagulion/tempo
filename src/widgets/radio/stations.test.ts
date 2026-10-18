import { describe, expect, it } from 'vitest';

import { genres } from './genres';
import type { RecordStation } from './record';
import { snapshotStations as all } from './saved';
import { filterStations, placeStation, sortStations, stationsForSource } from './stations';

function station(id: number, patch: Partial<RecordStation> = {}): RecordStation {
	return {
		id,
		prefix: `p${id}`,
		title: `Станция ${id}`,
		genres: [],
		stream: `https://example.com/${id}.aacp`,
		sort: id,
		...patch
	};
}

const ids = (list: RecordStation[]) => list.map((item) => item.id);

describe('stationsForSource', () => {
	it('все станции: в порядке Рекорда', () => {
		const list = [station(3), station(1), station(2)];
		expect(ids(stationsForSource(list, { kind: 'all' }))).toEqual([3, 1, 2]);
	});

	it('пресет: станции по порядку prefix, отсутствующие пропускаются, повторы убираются', () => {
		const list = [
			station(1, { prefix: 'a' }),
			station(2, { prefix: 'b' }),
			station(3, { prefix: 'c' })
		];
		const [first] = genres;
		const custom = [
			...list,
			station(4, { prefix: first.prefixes[1] }),
			station(5, { prefix: first.prefixes[0] })
		];
		expect(ids(stationsForSource(custom, { kind: 'genre', genre: first.id }))).toEqual([5, 4]);
	});

	it('каждый пресет находит станции в снимке и не имеет повторов prefix', () => {
		expect(genres.length).toBeGreaterThanOrEqual(4);
		for (const genre of genres) {
			const found = stationsForSource(all, { kind: 'genre', genre: genre.id });
			expect(found.length, genre.id).toBe(new Set(genre.prefixes).size);
		}
	});
});

describe('sortStations', () => {
	const list = [station(1), station(2), station(3), station(4)];

	it('default: порядок сохраняется, исходный массив не меняется', () => {
		const sorted = sortStations(list, 'default');
		expect(ids(sorted)).toEqual([1, 2, 3, 4]);
		expect(sorted).not.toBe(list);
	});

	it('shuffle: те же станции в другом порядке, исходный массив не меняется', () => {
		const sorted = sortStations(list, 'shuffle', () => 0);
		expect(ids(sorted)).toEqual([2, 3, 4, 1]);
		expect(ids(list)).toEqual([1, 2, 3, 4]);
		expect(ids(sortStations(list, 'shuffle')).sort()).toEqual([1, 2, 3, 4]);
	});
});

describe('placeStation', () => {
	const list = [station(1), station(2), station(3)];

	it('станция из списка остаётся на своём месте', () => {
		expect(placeStation(list, station(2))).toEqual({ list, index: 1 });
	});

	it('станция вне списка встаёт в начало', () => {
		const placed = placeStation(list, station(9));
		expect(ids(placed.list)).toEqual([9, 1, 2, 3]);
		expect(placed.index).toBe(0);
	});
});

describe('filterStations', () => {
	const list = [station(1, { title: 'Lo-Fi' }), station(2, { title: 'Chill House' })];

	it('ищет по названию без учёта регистра и пробелов', () => {
		expect(ids(filterStations(list, '  HOUSE '))).toEqual([2]);
	});

	it('пустой запрос возвращает все станции, ненайденное — пустой список', () => {
		expect(filterStations(list, '  ')).toBe(list);
		expect(filterStations(list, 'jazz')).toEqual([]);
	});
});
