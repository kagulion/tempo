import { describe, expect, it } from 'vitest';

import {
	findStationByUrl,
	migrateStation,
	parseSort,
	parseSource,
	parseStation,
	parseStationMap,
	snapshotStations
} from './saved';

function oldStation(url: string) {
	return {
		stationuuid: 'u',
		name: 'Старая',
		country: 'Russia',
		countrycode: 'RU',
		url_resolved: url,
		codec: 'AAC',
		hls: 0,
		votes: 5,
		clickcount: 7,
		tags: ''
	};
}

const record = 'radiorecord.hostingradio.ru';

describe('снимок станций', () => {
	it('читается целиком и по порядку sort', () => {
		expect(snapshotStations.length).toBeGreaterThan(100);
		const sorts = snapshotStations.map((item) => item.sort);
		expect(sorts).toEqual([...sorts].sort((a, b) => a - b));
	});
});

describe('findStationByUrl', () => {
	it('находит станцию по имени файла потока', () => {
		expect(findStationByUrl(`https://${record}/lofi96.aacp`)?.prefix).toBe('lofi');
	});

	it('http и регистр не важны', () => {
		expect(findStationByUrl(`http://RadioRecord.hostingradio.ru/LoFi96.AACP`)?.prefix).toBe('lofi');
	});

	it('другой битрейт того же потока находит станцию, если она одна', () => {
		expect(findStationByUrl(`https://${record}/lofi128.aacp`)?.prefix).toBe('lofi');
	});

	it('чужой хост, мусор и неизвестный поток дают undefined', () => {
		expect(findStationByUrl('https://example.com/lofi96.aacp')).toBeUndefined();
		expect(findStationByUrl(`https://${record}/unknown96.aacp`)).toBeUndefined();
		expect(findStationByUrl('not a url')).toBeUndefined();
		expect(findStationByUrl(42)).toBeUndefined();
	});
});

describe('migrateStation / parseStation', () => {
	it('станция Radio Browser с адресом Рекорда становится станцией Рекорда', () => {
		const migrated = migrateStation(oldStation(`http://${record}/deep96.aacp`));
		expect(migrated?.id).toBe(528);
		expect(migrated?.stream).toBe(`https://${record}/deep96.aacp`);
	});

	it('чужая станция и мусор отбрасываются', () => {
		expect(parseStation(oldStation('https://stream.example.com/jazz.mp3'))).toBeUndefined();
		expect(parseStation('station')).toBeUndefined();
		expect(parseStation(null)).toBeUndefined();
	});

	it('новый формат читается как есть, в том числе после JSON (sort Infinity → null)', () => {
		const saved = JSON.parse(
			JSON.stringify({
				id: 1,
				prefix: 'x',
				title: ' Станция ',
				genres: ['POP'],
				stream: 'https://example.com/x.aacp',
				sort: Infinity,
				icon: 'https://example.com/x.png'
			})
		);
		expect(parseStation(saved)).toEqual({
			id: 1,
			prefix: 'x',
			title: 'Станция',
			genres: ['POP'],
			stream: 'https://example.com/x.aacp',
			sort: Infinity,
			icon: 'https://example.com/x.png'
		});
	});

	it('новый формат с негодным потоком или id отбрасывается', () => {
		const http = { id: 1, title: 'A', stream: 'http://example.com/a.aacp' };
		const zero = { id: 0, title: 'A', stream: 'https://example.com/a.aacp' };
		expect(parseStation(http)).toBeUndefined();
		expect(parseStation(zero)).toBeUndefined();
	});
});

describe('parseStationMap', () => {
	it('переводит избранное, ключ — id Рекорда, дубли и чужие станции убирает', () => {
		const result = parseStationMap({
			a: oldStation(`https://${record}/ambient96.aacp`),
			b: oldStation(`http://${record}/ambient96.aacp`),
			c: oldStation('https://example.com/other.mp3')
		});
		expect(Object.keys(result ?? {})).toEqual(['42650']);
	});

	it('не объект отбрасывает', () => {
		expect(parseStationMap([])).toBeUndefined();
		expect(parseStationMap('x')).toBeUndefined();
	});
});

describe('parseSource', () => {
	it('читает новый формат', () => {
		expect(parseSource({ kind: 'all' })).toEqual({ kind: 'all' });
		expect(parseSource({ kind: 'genre', genre: 'deep' })).toEqual({ kind: 'genre', genre: 'deep' });
	});

	it('страна и поиск становятся «все станции»', () => {
		expect(parseSource({ kind: 'country', code: 'RU' })).toEqual({ kind: 'all' });
		expect(parseSource({ kind: 'search', query: 'jazz' })).toEqual({ kind: 'all' });
	});

	it('старые жанры lofi, ambient, chillout остаются, остальные становятся «все станции»', () => {
		expect(parseSource({ kind: 'genre', genre: 'ambient' })).toEqual({
			kind: 'genre',
			genre: 'ambient'
		});
		expect(parseSource({ kind: 'genre', genre: 'piano' })).toEqual({ kind: 'all' });
	});

	it('мусор отбрасывает', () => {
		expect(parseSource(null)).toBeUndefined();
		expect(parseSource({ kind: 'other' })).toBeUndefined();
	});
});

describe('parseSort', () => {
	it('читает shuffle и default, popular переводит в default', () => {
		expect(parseSort('shuffle')).toBe('shuffle');
		expect(parseSort('default')).toBe('default');
		expect(parseSort('popular')).toBe('default');
		expect(parseSort(1)).toBeUndefined();
	});
});
