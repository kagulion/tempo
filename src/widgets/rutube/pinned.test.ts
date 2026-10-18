import { describe, expect, it } from 'vitest';

import { pinnedStreams, rutubeThumbUrl } from './pinned';
import { rutubeTopics } from './rutube';

describe('pinnedStreams', () => {
	it('ключи — темы из rutubeTopics', () => {
		const topicIds: number[] = rutubeTopics.map((topic) => topic.id);
		for (const key of Object.keys(pinnedStreams)) expect(topicIds).toContain(Number(key));
	});

	it('у эфиров верные id, названия и превью, нет дублей, не больше 6 в теме', () => {
		for (const streams of Object.values(pinnedStreams)) {
			expect(streams.length).toBeGreaterThan(0);
			expect(streams.length).toBeLessThanOrEqual(6);
			expect(new Set(streams.map((stream) => stream.id)).size).toBe(streams.length);
			for (const stream of streams) {
				expect(stream.id).toMatch(/^[0-9a-f]{32}$/);
				expect(stream.title.trim()).not.toBe('');
				expect(stream.thumbnail).toBe(rutubeThumbUrl(stream.id));
			}
		}
	});

	it('адрес превью', () => {
		expect(rutubeThumbUrl('abc')).toBe('https://rutube.ru/api/video/abc/thumbnail/?redirect=1');
	});
});
