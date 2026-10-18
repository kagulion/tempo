import { describe, expect, it } from 'vitest';

import { defaultArtist, mediaInfo } from './mediaSession';

const station = { title: ' Record Lo-Fi ', icon: 'https://example.com/icon.png' };

describe('mediaInfo', () => {
	it('с треком: песня, исполнитель и обложка трека', () => {
		expect(
			mediaInfo(station, { artist: 'Artist', song: 'Song', cover: 'https://example.com/c.jpg' })
		).toEqual({
			title: 'Song',
			artist: 'Artist',
			album: 'Record Lo-Fi',
			artwork: [{ src: 'https://example.com/c.jpg' }]
		});
	});

	it('трек без обложки берёт иконку станции', () => {
		expect(mediaInfo(station, { artist: 'A', song: 'S' }).artwork).toEqual([
			{ src: 'https://example.com/icon.png' }
		]);
	});

	it('без трека: станция и «Радио Рекорд»', () => {
		const info = mediaInfo(station);
		expect(info.title).toBe('Record Lo-Fi');
		expect(info.artist).toBe(defaultArtist);
	});

	it('пустой исполнитель заменяется, нет иконки — нет обложки', () => {
		const info = mediaInfo({ title: 'X' }, { artist: ' ', song: 'S' });
		expect(info.artist).toBe(defaultArtist);
		expect(info.artwork).toEqual([]);
	});
});
