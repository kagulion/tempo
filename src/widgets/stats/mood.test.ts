import { describe, expect, it } from 'vitest';

import {
	dayLabel,
	maxNoteLength,
	monthAverage,
	monthGrid,
	moodLevels,
	parseMood,
	setMood,
	setNote,
	type MoodEntries
} from './mood';

describe('moodLevels', () => {
	it('пять уровней по порядку', () => {
		expect(moodLevels.map((item) => item.level)).toEqual([1, 2, 3, 4, 5]);
	});
});

describe('parseMood', () => {
	it('читает годные записи', () => {
		expect(parseMood({ '2026-10-15': { level: 4, note: 'Хороший день' } })).toEqual({
			'2026-10-15': { level: 4, note: 'Хороший день' }
		});
	});

	it('не объект отбрасывает', () => {
		expect(parseMood(null)).toBeUndefined();
		expect(parseMood('x')).toBeUndefined();
		expect(parseMood([{ level: 3 }])).toBeUndefined();
	});

	it('убирает плохие ключи и оценки', () => {
		expect(
			parseMood({
				'2026-10-15': { level: 3 },
				'15.10.2026': { level: 3 },
				'2026-10-14': { level: 6 },
				'2026-10-13': { level: 2.5 },
				'2026-10-12': { level: '3' },
				'2026-10-11': null
			})
		).toEqual({ '2026-10-15': { level: 3 } });
	});

	it('обрезает пробелы и длину заметки, пустую убирает', () => {
		const parsed = parseMood({
			'2026-10-15': { level: 3, note: '  привет  ' },
			'2026-10-14': { level: 3, note: '   ' },
			'2026-10-13': { level: 3, note: 'я'.repeat(300) },
			'2026-10-12': { level: 3, note: 42 }
		});
		expect(parsed?.['2026-10-15']).toEqual({ level: 3, note: 'привет' });
		expect(parsed?.['2026-10-14']).toEqual({ level: 3 });
		expect(parsed?.['2026-10-13']?.note).toHaveLength(maxNoteLength);
		expect(parsed?.['2026-10-12']).toEqual({ level: 3 });
	});
});

describe('setMood', () => {
	it('ставит оценку и не меняет исходный объект', () => {
		const entries: MoodEntries = {};
		const next = setMood(entries, '2026-10-15', 4);
		expect(next).toEqual({ '2026-10-15': { level: 4 } });
		expect(entries).toEqual({});
	});

	it('та же оценка снимает запись', () => {
		const entries: MoodEntries = { '2026-10-15': { level: 4, note: 'ок' } };
		expect(setMood(entries, '2026-10-15', 4)).toEqual({});
		expect(entries['2026-10-15']).toBeDefined();
	});

	it('другая оценка сохраняет заметку', () => {
		const entries: MoodEntries = { '2026-10-15': { level: 4, note: 'ок' } };
		expect(setMood(entries, '2026-10-15', 2)).toEqual({ '2026-10-15': { level: 2, note: 'ок' } });
	});
});

describe('setNote', () => {
	const entries: MoodEntries = { '2026-10-15': { level: 4 } };

	it('сохраняет заметку без лишних пробелов', () => {
		expect(setNote(entries, '2026-10-15', '  кофе  ')).toEqual({
			'2026-10-15': { level: 4, note: 'кофе' }
		});
		expect(entries['2026-10-15']).toEqual({ level: 4 });
	});

	it('подрезает длинную заметку и убирает пустую', () => {
		const long = setNote(entries, '2026-10-15', 'я'.repeat(200));
		expect(long['2026-10-15']?.note).toHaveLength(maxNoteLength);
		const withNote: MoodEntries = { '2026-10-15': { level: 4, note: 'x' } };
		expect(setNote(withNote, '2026-10-15', '  ')).toEqual({ '2026-10-15': { level: 4 } });
	});

	it('для дня без оценки ничего не делает', () => {
		expect(setNote(entries, '2026-10-14', 'текст')).toEqual(entries);
	});
});

describe('monthGrid', () => {
	it('недели с понедельника, пустые клетки — null', () => {
		const weeks = monthGrid(2026, 9); // октябрь 2026 начинается в четверг
		expect(weeks.every((week) => week.length === 7)).toBe(true);
		expect(weeks[0]).toEqual([
			null,
			null,
			null,
			'2026-10-01',
			'2026-10-02',
			'2026-10-03',
			'2026-10-04'
		]);
		expect(weeks.at(-1)?.[3]).toBe('2026-10-29');
		expect(weeks.flat().filter(Boolean)).toHaveLength(31);
	});

	it('месяц, который начинается в воскресенье', () => {
		const weeks = monthGrid(2026, 1); // февраль 2026: 1-е — воскресенье
		expect(weeks[0]).toEqual([null, null, null, null, null, null, '2026-02-01']);
		expect(weeks).toHaveLength(5);
		expect(weeks.flat().filter(Boolean)).toHaveLength(28);
	});

	it('високосный февраль', () => {
		const days = monthGrid(2028, 1).flat().filter(Boolean);
		expect(days).toHaveLength(29);
		expect(days.at(-1)).toBe('2028-02-29');
	});

	it('месяц, который начинается в понедельник, без пустых клеток в начале', () => {
		expect(monthGrid(2026, 5)[0]?.[0]).toBe('2026-06-01');
	});
});

describe('monthAverage', () => {
	const entries: MoodEntries = {
		'2026-10-01': { level: 5 },
		'2026-10-15': { level: 4 },
		'2026-10-20': { level: 3 },
		'2026-09-30': { level: 1 },
		'2026-11-01': { level: 1 }
	};

	it('среднее только по дням месяца', () => {
		expect(monthAverage(entries, 2026, 9)).toBe(4);
	});

	it('без оценок — null', () => {
		expect(monthAverage(entries, 2026, 0)).toBeNull();
	});
});

describe('dayLabel', () => {
	it('называет дату и оценку', () => {
		expect(dayLabel('2026-10-19', { level: 4 })).toBe('19 октября 2026, настроение: хорошо');
	});

	it('день без оценки', () => {
		expect(dayLabel('2026-10-05', undefined)).toBe('5 октября 2026, без оценки');
	});

	it('добавляет заметку', () => {
		expect(dayLabel('2026-01-02', { level: 1, note: 'ужас' })).toBe(
			'2 января 2026, настроение: ужасно, заметка: ужас'
		);
	});
});
