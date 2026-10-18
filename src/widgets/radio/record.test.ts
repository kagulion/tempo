import { describe, expect, it } from 'vitest';

import { normalizeRecordNow, normalizeRecordStations } from './record';

const chill = {
	id: 2,
	prefix: 'chil',
	title: 'Chill-Out',
	sort: 20,
	bg_color: '#112233',
	icon_fill_colored: 'https://example.com/chill.svg',
	stream_64: 'https://s.example/chil64.aacp',
	stream_128: 'https://s.example/chil96.aacp',
	stream_320: 'https://s.example/chil320.mp3',
	stream_hls: 'https://h.example/record-chil/playlist.m3u8',
	genre: [
		{ id: 1, name: 'Chill' },
		{ id: 2, name: '' }
	]
};
const lofi = {
	id: 1,
	prefix: 'lofi',
	title: 'Lo-Fi',
	sort: 10,
	stream_128: 'https://s.example/lofi.aacp'
};

describe('normalizeRecordStations', () => {
	it('принимает полный ответ и массив, сортирует по sort', () => {
		const full = normalizeRecordStations({ result: { stations: [chill, lofi] } });
		expect(full.map((s) => s.id)).toEqual([1, 2]);
		expect(normalizeRecordStations([chill, lofi])).toEqual(full);
	});

	it('собирает поля станции', () => {
		const [station] = normalizeRecordStations([chill]);
		expect(station).toEqual({
			id: 2,
			prefix: 'chil',
			title: 'Chill-Out',
			genres: ['Chill'],
			stream: 'https://s.example/chil96.aacp',
			hls: 'https://h.example/record-chil/playlist.m3u8',
			color: '#112233',
			icon: 'https://example.com/chill.svg',
			sort: 20
		});
	});

	it('берёт запасные потоки: 320, затем 64', () => {
		const [a] = normalizeRecordStations([{ ...chill, stream_128: '' }]);
		expect(a.stream).toBe('https://s.example/chil320.mp3');
		const [b] = normalizeRecordStations([{ ...chill, stream_128: null, stream_320: undefined }]);
		expect(b.stream).toBe('https://s.example/chil64.aacp');
	});

	it('пропускает http-потоки', () => {
		const http = { ...chill, stream_128: 'http://s.example/a', stream_64: 'http://s.example/b' };
		expect(normalizeRecordStations([http])[0].stream).toBe('https://s.example/chil320.mp3');
		expect(normalizeRecordStations([{ ...http, stream_320: 'http://s.example/c' }])).toEqual([]);
		const noHls = normalizeRecordStations([{ ...chill, stream_hls: 'http://h/x.m3u8' }])[0];
		expect(noHls.hls).toBeUndefined();
	});

	it('отбрасывает плохие записи и данные', () => {
		expect(normalizeRecordStations(null)).toEqual([]);
		expect(normalizeRecordStations('x')).toEqual([]);
		expect(normalizeRecordStations({ result: {} })).toEqual([]);
		expect(
			normalizeRecordStations([
				null,
				5,
				{ ...chill, id: 'a' },
				{ ...chill, title: '  ' },
				{ ...chill, id: 0 }
			])
		).toEqual([]);
	});

	it('убирает дубликаты id, пустые поля не добавляет, без sort — в конец', () => {
		const bare = { id: 3, title: 'Bare', stream_64: 'https://s.example/bare' };
		const list = normalizeRecordStations([bare, chill, chill]);
		expect(list.map((s) => s.id)).toEqual([2, 3]);
		expect(list[1]).toMatchObject({ prefix: '', genres: [] });
		expect(list[1]).not.toHaveProperty('color');
		expect(list[1]).not.toHaveProperty('icon');
		expect(list[1]).not.toHaveProperty('hls');
	});
});

describe('normalizeRecordNow', () => {
	const entry = {
		id: 2,
		track: {
			id: 9,
			artist: ' Artist ',
			song: 'Song',
			image100: 'https://i/100',
			image200: 'https://i/200'
		}
	};

	it('принимает ответ и массив', () => {
		const expected = [{ stationId: 2, artist: 'Artist', song: 'Song', cover: 'https://i/200' }];
		expect(normalizeRecordNow({ result: [entry] })).toEqual(expected);
		expect(normalizeRecordNow([entry])).toEqual(expected);
	});

	it('обложка: запасные размеры, http отбрасывается', () => {
		const t = (track: object) => normalizeRecordNow([{ id: 1, track: { song: 's', ...track } }])[0];
		expect(t({ image100: 'https://i/100' }).cover).toBe('https://i/100');
		expect(t({ image200: 'http://i/200', image600: 'https://i/600' }).cover).toBe('https://i/600');
		expect(t({ image200: 'http://i/200' })).not.toHaveProperty('cover');
	});

	it('отбрасывает записи без станции, трека или названия', () => {
		expect(normalizeRecordNow(undefined)).toEqual([]);
		expect(
			normalizeRecordNow([
				{ id: 1 },
				{ id: 'x', track: { song: 's' } },
				{ id: 1, track: { artist: 'a', song: '' } },
				{ track: { song: 's' } }
			])
		).toEqual([]);
	});

	it('пустой артист допустим', () => {
		expect(normalizeRecordNow([{ id: 1, track: { song: 's' } }])).toEqual([
			{ stationId: 1, artist: '', song: 's' }
		]);
	});
});
