import { describe, expect, it } from 'vitest';

import {
	allowedTopics,
	excludedTopics,
	parseTopic,
	topCount,
	topicIds,
	topicPriority,
	topStreams
} from './topStreams.ts';

function item(n: number, extra: Record<string, unknown> = {}) {
	return {
		id: n.toString(16).padStart(32, '0'),
		title: `Эфир ${n}`,
		thumbnail_url: `https://pic/${n}.jpg`,
		hits: n,
		author: { name: `Автор ${n}` },
		...extra
	};
}

describe('parseTopic', () => {
	it('принимает темы из белого списка', () => {
		for (const topic of allowedTopics) expect(parseTopic(String(topic))).toBe(topic);
	});

	it('остальное отклоняет', () => {
		for (const value of [null, '', '1', '3', '02', '2.0', '-2', 'abc', '2;3', '1000']) {
			expect(parseTopic(value)).toBeUndefined();
		}
	});
});

describe('topStreams', () => {
	it('сохраняет порядок Rutube и оставляет шесть', () => {
		const results = Array.from({ length: 20 }, (_, i) => item(i + 1));
		const top = topStreams({ results }, 8);
		expect(top).toHaveLength(topCount);
		expect(top.map((stream) => stream.hits)).toEqual([1, 2, 3, 4, 5, 6]);
	});

	it('переносит поля', () => {
		expect(topStreams({ results: [item(7)] }, 8)).toEqual([
			{
				id: item(7).id,
				title: 'Эфир 7',
				author: 'Автор 7',
				thumbnail: 'https://pic/7.jpg',
				hits: 7
			}
		]);
	});

	it('выбрасывает платные и для взрослых', () => {
		const results = [item(9, { is_paid: true }), item(8, { is_adult: true }), item(1)];
		expect(topStreams({ results }, 8).map((stream) => stream.hits)).toEqual([1]);
	});

	it('выбрасывает дубли и элементы без id или названия, не падает без автора', () => {
		const results = [
			item(3),
			item(3),
			item(4, { id: 'bad' }),
			item(5, { title: '' }),
			item(6, { author: null })
		];
		const top = topStreams({ results }, 8);
		expect(top.map((stream) => stream.hits)).toEqual([3, 6]);
		expect(top[1].author).toBe('');
	});

	it('выбрасывает новости, федеральные и региональные', () => {
		for (const excluded of excludedTopics) {
			expect(topStreams({ results: [item(1, { topics: [2, excluded] })] }, 2)).toEqual([]);
		}
		expect(topStreams({ results: [item(1, { topics: [2, 1] })] }, 2)).toHaveLength(1);
	});

	it('показывает эфир только в самой приоритетной теме', () => {
		const results = [item(1, { topics: [5, 2, 1] }), item(2, { topics: [2] })];
		expect(topStreams({ results }, 2).map((stream) => stream.hits)).toEqual([2]);
		expect(topStreams({ results }, 5).map((stream) => stream.hits)).toEqual([1, 2]);
	});

	it('учитывает весь порядок приоритета', () => {
		const all = item(1, { topics: [...topicPriority] });
		expect(topicPriority).toEqual([15, 8, 10, 5, 2]);
		for (const topic of allowedTopics) {
			const shown = topStreams({ results: [all] }, topic).length;
			expect(shown).toBe(topic === 15 ? 1 : 0);
		}
		const music = item(2, { topics: [2, 5, 10, 8] });
		// Тему 15 не проверяем: Rutube не вернул бы этот эфир в её ответе
		expect(
			allowedTopics.filter((t) => t !== 15 && topStreams({ results: [music] }, t).length > 0)
		).toEqual([8]);
	});

	it('понимает topics в виде чисел, объектов и с дублями', () => {
		expect([...topicIds([5, { id: 2 }, 5, { id: '8' }, null, 'x', 1.5])]).toEqual([5, 2, 8]);
		expect(topicIds(undefined).size).toBe(0);
		const results = [
			item(1, { topics: [{ id: 4 }, { id: 2 }] }),
			item(2, { topics: [{ id: 2 }, 2] })
		];
		expect(topStreams({ results }, 2).map((stream) => stream.hits)).toEqual([2]);
	});

	it('эфир без topics подходит любой теме', () => {
		expect(topStreams({ results: [item(1)] }, 15)).toHaveLength(1);
	});

	it('мусор даёт пустой список', () => {
		expect(topStreams(null, 8)).toEqual([]);
		expect(topStreams({}, 8)).toEqual([]);
		expect(topStreams({ results: 'x' }, 8)).toEqual([]);
	});
});
