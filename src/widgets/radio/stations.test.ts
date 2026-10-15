import { describe, expect, it } from 'vitest';

import { genres } from './genres';
import {
	buildGenreList,
	buildSearchParams,
	curatedIds,
	filterPlayable,
	formatCount,
	mergeStations,
	normalizeStation,
	parseLiked,
	parseSort,
	parseSource,
	parseStationMap,
	placeStation,
	sortStations,
	type Station
} from './stations';

function station(uuid: string, patch: Partial<Station> = {}): Station {
	return {
		stationuuid: uuid,
		name: `Станция ${uuid}`,
		country: 'Germany',
		countrycode: 'DE',
		url_resolved: `https://example.com/${uuid}.mp3`,
		codec: 'MP3',
		hls: 0,
		votes: 0,
		clickcount: 0,
		tags: '',
		...patch
	};
}

const ids = (list: Station[]) => list.map((item) => item.stationuuid);

describe('buildSearchParams', () => {
	it('страна: топ по голосам с кодом страны', () => {
		const [params] = buildSearchParams({ kind: 'country', code: 'DE' });
		expect(params.get('countrycode')).toBe('DE');
		expect(params.get('order')).toBe('votes');
		expect(params.get('hidebroken')).toBe('true');
	});

	it('поиск: по названию, без страны, 100 станций', () => {
		const params = buildSearchParams({ kind: 'search', query: '  jazz fm ' });
		expect(params).toHaveLength(1);
		expect(params[0].get('name')).toBe('jazz fm');
		expect(params[0].has('countrycode')).toBe(false);
		expect(params[0].get('limit')).toBe('100');
		expect(params[0].get('reverse')).toBe('true');
	});

	it('жанр: отдельный запрос с tagExact на каждый тег', () => {
		const params = buildSearchParams({ kind: 'genre', genre: 'lofi' });
		expect(params.map((item) => item.get('tag'))).toEqual([
			'lofi',
			'lo-fi',
			'chillhop',
			'lofi hip hop'
		]);
		for (const item of params) {
			expect(item.get('tagExact')).toBe('true');
			expect(item.has('tagList')).toBe(false);
			expect(item.get('limit')).toBe('100');
		}
	});
});

describe('filterPlayable', () => {
	it('оставляет только https, не HLS, поддерживаемые кодеки', () => {
		const list = [
			station('ok'),
			station('http', { url_resolved: 'http://example.com/a.mp3' }),
			station('hls', { hls: 1 }),
			station('m3u8', { url_resolved: 'https://example.com/a.m3u8' }),
			station('flac', { codec: 'FLAC' }),
			station('aac', { codec: 'aac+' })
		];
		expect(ids(filterPlayable(list))).toEqual(['ok', 'aac']);
	});

	it('убирает копии по имени и стране, оставляя первую', () => {
		const list = [
			station('a', { name: 'Radio One' }),
			station('b', { name: ' radio one ' }),
			station('c', { name: 'Radio One', countrycode: 'FR' })
		];
		expect(ids(filterPlayable(list))).toEqual(['a', 'c']);
	});
});

describe('mergeStations', () => {
	it('склеивает списки без повторов по stationuuid, порядок по первому вхождению', () => {
		const merged = mergeStations([station('a'), station('b')], [station('b'), station('c')]);
		expect(ids(merged)).toEqual(['a', 'b', 'c']);
	});
});

describe('buildGenreList', () => {
	it('проверенные станции идут первыми, исключённые убираются', () => {
		const lofi = genres.find((genre) => genre.id === 'lofi')!;
		const curated = [station(lofi.curated![0])];
		const excluded = station(lofi.excluded![0]);
		const list = buildGenreList('lofi', curated, [
			station('x'),
			excluded,
			station(lofi.curated![0]),
			station('y')
		]);
		expect(ids(list)).toEqual([lofi.curated![0], 'x', 'y']);
	});

	it('проверенная станция с негодным потоком отбрасывается', () => {
		const list = buildGenreList('medieval', [station('a', { hls: 1 })], [station('b')]);
		expect(ids(list)).toEqual(['b']);
	});
});

describe('curatedIds', () => {
	it('для жанра отдаёт проверенные станции, для остальных источников — пусто', () => {
		expect(curatedIds({ kind: 'genre', genre: 'medieval' }).length).toBeGreaterThan(0);
		expect(curatedIds({ kind: 'country', code: 'DE' })).toEqual([]);
	});
});

describe('sortStations', () => {
	const list = [
		station('a', { votes: 5 }),
		station('b', { votes: 10, clickcount: 1 }),
		station('c', { votes: 10, clickcount: 9 }),
		station('d', { votes: 1 })
	];

	it('popular: по голосам, при равенстве по кликам', () => {
		expect(ids(sortStations(list, 'popular'))).toEqual(['c', 'b', 'a', 'd']);
	});

	it('shuffle: тот же набор станций, исходный список не меняется', () => {
		const before = ids(list);
		const result = sortStations(list, 'shuffle', [], () => 0);
		expect([...ids(result)].sort()).toEqual(['a', 'b', 'c', 'd']);
		expect(ids(list)).toEqual(before);
	});

	it('popular: закреплённые не влияют, порядок строго по голосам', () => {
		expect(ids(sortStations(list, 'popular', ['d', 'a']))).toEqual(['c', 'b', 'a', 'd']);
	});

	it('shuffle: закреплённые станции идут первыми', () => {
		const result = sortStations(list, 'shuffle', ['d', 'a'], () => 0);
		expect(ids(result).slice(0, 2).sort()).toEqual(['a', 'd']);
	});
});

describe('placeStation', () => {
	const sorted = [
		station('c', { votes: 10 }),
		station('a', { votes: 5 }),
		station('d', { votes: 1 })
	];

	it('станция из списка остаётся на своём месте', () => {
		expect(placeStation(sorted, station('a', { votes: 5 }), 'popular')).toEqual({
			list: sorted,
			index: 1
		});
	});

	it('popular: станция вне списка встаёт по голосам', () => {
		const result = placeStation(sorted, station('x', { votes: 7 }), 'popular');
		expect(ids(result.list)).toEqual(['c', 'x', 'a', 'd']);
		expect(result.index).toBe(1);
		expect(placeStation(sorted, station('y', { votes: 0 }), 'popular').index).toBe(3);
	});

	it('shuffle: станция вне списка идёт в начало', () => {
		const result = placeStation(sorted, station('x', { votes: 7 }), 'shuffle');
		expect(ids(result.list)).toEqual(['x', 'c', 'a', 'd']);
		expect(result.index).toBe(0);
	});
});

describe('normalizeStation', () => {
	it('у станции из старого сохранения votes, clickcount и tags равны нулю и пустой строке', () => {
		const saved = {
			stationuuid: 'u',
			name: 'Old',
			country: 'Germany',
			countrycode: 'DE',
			url_resolved: 'https://example.com/a.mp3',
			codec: 'MP3',
			hls: 0
		};
		expect(normalizeStation(saved)).toEqual({ ...saved, votes: 0, clickcount: 0, tags: '' });
	});

	it('мусор отбрасывает', () => {
		expect(normalizeStation(null)).toBeUndefined();
		expect(normalizeStation('u')).toBeUndefined();
		expect(normalizeStation({ stationuuid: 'u' })).toBeUndefined();
	});

	it('странные числа заменяет нулём', () => {
		const result = normalizeStation({ ...station('u'), votes: 'много', clickcount: -3 });
		expect(result?.votes).toBe(0);
		expect(result?.clickcount).toBe(0);
	});
});

describe('formatCount', () => {
	it('показывает число коротко', () => {
		expect(formatCount(0)).toBe('0');
		expect(formatCount(950)).toBe('950');
		expect(formatCount(1000)).toBe('1k');
		expect(formatCount(1234)).toBe('1.2k');
		expect(formatCount(9999)).toBe('9.9k');
		expect(formatCount(12_500)).toBe('12k');
	});
});

describe('сохранённые данные радио', () => {
	it('источник: читает три вида и отвергает мусор', () => {
		expect(parseSource({ kind: 'country', code: 'DE' })).toEqual({ kind: 'country', code: 'DE' });
		expect(parseSource({ kind: 'genre', genre: 'jazz' })).toEqual({ kind: 'genre', genre: 'jazz' });
		expect(parseSource({ kind: 'search', query: 'abc' })).toEqual({ kind: 'search', query: 'abc' });
		expect(parseSource({ kind: 'genre', genre: 'removed' })).toBeUndefined();
		expect(parseSource({ kind: 'country', code: '' })).toBeUndefined();
		expect(parseSource({ kind: 'search' })).toBeUndefined();
		expect(parseSource('DE')).toBeUndefined();
		expect(parseSource(null)).toBeUndefined();
	});

	it('сортировка', () => {
		expect(parseSort('popular')).toBe('popular');
		expect(parseSort('shuffle')).toBe('shuffle');
		expect(parseSort('other')).toBeUndefined();
	});

	it('лайки: оставляет числа-времена', () => {
		expect(parseLiked({ a: 1700000000000, b: 'x' })).toEqual({ a: 1700000000000 });
		expect(parseLiked([1])).toBeUndefined();
		expect(parseLiked(null)).toBeUndefined();
	});

	it('избранное: плохие записи отбрасывает, у старых добавляет поля', () => {
		const old = { ...station('a') } as Partial<Station>;
		delete old.votes;
		delete old.clickcount;
		delete old.tags;
		expect(parseStationMap({ a: old, b: { stationuuid: 'b' }, c: null })).toEqual({
			a: station('a')
		});
		expect(parseStationMap([])).toBeUndefined();
	});
});
