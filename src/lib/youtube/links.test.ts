import { describe, expect, it } from 'vitest';

import { parseTimestamp, parseYouTubeUrl } from './links';

const id = 'dQw4w9WgXcQ';

describe('parseYouTubeUrl', () => {
	it.each([
		`https://www.youtube.com/watch?v=${id}`,
		`https://youtube.com/watch?v=${id}&list=PL123&index=2`,
		`https://m.youtube.com/watch?v=${id}`,
		`https://music.youtube.com/watch?v=${id}`,
		`https://youtu.be/${id}`,
		`https://youtu.be/${id}?si=abc`,
		`https://www.youtube.com/shorts/${id}`,
		`https://www.youtube.com/live/${id}?feature=share`,
		`https://www.youtube.com/embed/${id}`,
		`https://www.youtube-nocookie.com/embed/${id}`,
		`http://youtube.com/watch?v=${id}`,
		`youtube.com/watch?v=${id}`,
		`www.youtube.com/watch?v=${id}`,
		`youtu.be/${id}`,
		`  https://youtu.be/${id}  `,
		`\n${id}\t`,
		id
	])('понимает %j', (input) => {
		expect(parseYouTubeUrl(input)).toEqual({ videoId: id });
	});

	it('понимает id с дефисом и подчёркиванием', () => {
		expect(parseYouTubeUrl('-_aB3-_xY9z')).toEqual({ videoId: '-_aB3-_xY9z' });
	});

	it('достаёт время старта', () => {
		expect(parseYouTubeUrl(`https://youtu.be/${id}?t=90`)).toEqual({ videoId: id, start: 90 });
		expect(parseYouTubeUrl(`https://youtu.be/${id}?t=1m30s`)).toEqual({ videoId: id, start: 90 });
		expect(parseYouTubeUrl(`https://www.youtube.com/watch?v=${id}&t=90s`)).toEqual({
			videoId: id,
			start: 90
		});
		expect(parseYouTubeUrl(`https://www.youtube.com/watch?v=${id}&start=12`)).toEqual({
			videoId: id,
			start: 12
		});
		expect(parseYouTubeUrl(`https://www.youtube.com/embed/${id}?start=5`)).toEqual({
			videoId: id,
			start: 5
		});
		expect(parseYouTubeUrl(`https://www.youtube.com/watch?v=${id}#t=45`)).toEqual({
			videoId: id,
			start: 45
		});
	});

	it('непонятное или нулевое время не мешает видео', () => {
		expect(parseYouTubeUrl(`https://youtu.be/${id}?t=abc`)).toEqual({ videoId: id });
		expect(parseYouTubeUrl(`https://youtu.be/${id}?t=0`)).toEqual({ videoId: id });
		expect(parseYouTubeUrl(`https://youtu.be/${id}?t=`)).toEqual({ videoId: id });
	});

	it.each([
		'',
		'   ',
		'привет',
		'https://example.com',
		`https://example.com/watch?v=${id}`,
		`https://youtube.com.evil.example/watch?v=${id}`,
		`https://notyoutube.com/watch?v=${id}`,
		'https://www.youtube.com/',
		'https://www.youtube.com/watch',
		'https://www.youtube.com/watch?v=short',
		`https://www.youtube.com/watch?v=${id}x`,
		'https://www.youtube.com/playlist?list=PL123',
		'https://www.youtube.com/@channel',
		`https://www.youtube-nocookie.com/watch?v=${id}`,
		`https://youtu.be/${id}x`,
		`ftp://youtu.be/${id}`,
		`javascript:alert('${id}')`,
		'dQw4w9WgXc',
		'dQw4w9WgXcQQ',
		'dQw4w9WgXc!'
	])('отбрасывает %j', (input) => {
		expect(parseYouTubeUrl(input)).toBeUndefined();
	});
});

describe('parseTimestamp', () => {
	it('переводит форматы в секунды', () => {
		expect(parseTimestamp('90')).toBe(90);
		expect(parseTimestamp('90s')).toBe(90);
		expect(parseTimestamp('1m30s')).toBe(90);
		expect(parseTimestamp('2m')).toBe(120);
		expect(parseTimestamp('1h2m3s')).toBe(3723);
		expect(parseTimestamp('1H')).toBe(3600);
	});

	it('мусор, ноль и пустое значение — undefined', () => {
		expect(parseTimestamp('')).toBeUndefined();
		expect(parseTimestamp(null)).toBeUndefined();
		expect(parseTimestamp('0')).toBeUndefined();
		expect(parseTimestamp('0s')).toBeUndefined();
		expect(parseTimestamp('-5')).toBeUndefined();
		expect(parseTimestamp('1.5')).toBeUndefined();
		expect(parseTimestamp('1x')).toBeUndefined();
		expect(parseTimestamp('30s1m')).toBeUndefined();
	});
});
