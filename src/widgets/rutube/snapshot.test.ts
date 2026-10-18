import { describe, expect, it } from 'vitest';

import snapshotJson from './rutube-streams.json';
import { parseSnapshot } from './snapshot';
import { streamsFor, topicsWithStreams } from './streams';

const id = '546602986e6a424d74d594876ddb3f04';

describe('parseSnapshot', () => {
	it('оставляет годные эфиры', () => {
		expect(parseSnapshot({ '2': [{ id, title: 'Эфир', author: 'Автор' }] })).toEqual({
			'2': [{ id, title: 'Эфир', author: 'Автор' }]
		});
	});

	it('отбрасывает плохие элементы, дубли, неизвестные темы и пустые темы', () => {
		const good = { id, title: 'T', author: 1 };
		expect(
			parseSnapshot({
				'2': [good, good, { id: 'bad', title: 'T' }, { id, title: ' ' }, null, 'x'],
				'99': [good],
				'5': [{ id: 'bad', title: 'T' }],
				'8': 'не список'
			})
		).toEqual({ '2': [{ id, title: 'T', author: '' }] });
	});

	it('мусор даёт пустой снимок', () => {
		for (const raw of [null, undefined, 5, 'x', []]) expect(parseSnapshot(raw)).toEqual({});
	});

	it('сохранённый файл годен целиком', () => {
		const parsed = parseSnapshot(snapshotJson);
		expect(parsed).toEqual(snapshotJson);
	});
});

describe('streamsFor', () => {
	it('отдаёт эфиры всех тем, не больше шести, с превью', () => {
		expect(topicsWithStreams.length).toBe(5);
		for (const topic of topicsWithStreams) {
			const streams = streamsFor(topic.id);
			expect(streams.length).toBeLessThanOrEqual(6);
			for (const stream of streams) expect(stream.thumbnail).toContain(stream.id);
		}
	});

	it('ручной список важнее снимка', () => {
		expect(streamsFor(8)[0].title).toBe('МУЗ-ТВ');
	});
});
