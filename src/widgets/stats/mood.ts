// Трекер настроения без React и без хранилища: одна оценка в день и короткая заметка.
// Хук — в useMood.ts, карточка — в MoodCard.tsx. Тесты — в mood.test.ts
import { isRecord } from '@/lib/storage';

import { dayKey } from './visits';

export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export type MoodEntry = {
	level: MoodLevel;
	note?: string;
};

// Ключ — день в формате dayKey: 2026-10-15
export type MoodEntries = Record<string, MoodEntry>;

export const maxNoteLength = 140;

export const moodLevels: readonly {
	level: MoodLevel;
	emoji: string;
	label: string;
	// Tailwind-класс фона
	color: string;
	// Заливка клетки календаря; классы целиком, иначе Tailwind их не найдёт
	cell: string;
}[] = [
	{
		level: 1,
		emoji: '😞',
		label: 'Ужасно',
		color: 'bg-red-400',
		cell: 'bg-red-400/70 hover:bg-red-400'
	},
	{
		level: 2,
		emoji: '🙁',
		label: 'Плохо',
		color: 'bg-orange-400',
		cell: 'bg-orange-400/70 hover:bg-orange-400'
	},
	{
		level: 3,
		emoji: '😐',
		label: 'Нормально',
		color: 'bg-yellow-300',
		cell: 'bg-yellow-300/70 hover:bg-yellow-300'
	},
	{
		level: 4,
		emoji: '🙂',
		label: 'Хорошо',
		color: 'bg-lime-400',
		cell: 'bg-lime-400/70 hover:bg-lime-400'
	},
	{
		level: 5,
		emoji: '😄',
		label: 'Отлично',
		color: 'bg-emerald-400',
		cell: 'bg-emerald-400/70 hover:bg-emerald-400'
	}
];

const dayPattern = /^\d{4}-\d{2}-\d{2}$/;

function isLevel(value: unknown): value is MoodLevel {
	return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5;
}

// Обрезает пробелы и длину; пустая заметка — undefined
function cleanNote(note: unknown) {
	if (typeof note !== 'string') return undefined;
	return note.trim().slice(0, maxNoteLength).trim() || undefined;
}

function makeEntry(level: MoodLevel, note: string | undefined): MoodEntry {
	return note ? { level, note } : { level };
}

// Оставляет только записи с днём вида 2026-10-15 и оценкой 1–5
export function parseMood(saved: unknown): MoodEntries | undefined {
	if (!isRecord(saved)) return undefined;

	const entries: MoodEntries = {};
	for (const [day, value] of Object.entries(saved)) {
		if (!dayPattern.test(day) || !isRecord(value) || !isLevel(value.level)) continue;
		entries[day] = makeEntry(value.level, cleanNote(value.note));
	}
	return entries;
}

// Ставит оценку дню; та же оценка второй раз снимает её вместе с заметкой.
// При смене оценки заметка остаётся. Исходный объект не меняется
export function setMood(entries: MoodEntries, day: string, level: MoodLevel): MoodEntries {
	const next = { ...entries };
	const current = entries[day];
	if (current?.level === level) {
		delete next[day];
	} else {
		next[day] = makeEntry(level, current?.note);
	}
	return next;
}

// Меняет заметку дня, у которого есть оценка. Исходный объект не меняется
export function setNote(entries: MoodEntries, day: string, note: string): MoodEntries {
	const current = entries[day];
	if (!current) return entries;
	return { ...entries, [day]: makeEntry(current.level, cleanNote(note)) };
}

// Недели месяца с понедельника: dayKey или null для пустых клеток. month — как у Date, 0–11
export function monthGrid(year: number, month: number): (string | null)[][] {
	const offset = (new Date(year, month, 1).getDay() + 6) % 7;
	const count = new Date(year, month + 1, 0).getDate();

	const cells: (string | null)[] = Array.from({ length: offset }, () => null);
	for (let day = 1; day <= count; day++) cells.push(dayKey(new Date(year, month, day).getTime()));
	while (cells.length % 7 !== 0) cells.push(null);

	const weeks: (string | null)[][] = [];
	for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
	return weeks;
}

// Среднее по дням месяца с оценкой; null, если оценок нет
export function monthAverage(entries: MoodEntries, year: number, month: number): number | null {
	const prefix = dayKey(new Date(year, month, 1).getTime()).slice(0, 8);
	const levels = Object.entries(entries)
		.filter(([day]) => day.startsWith(prefix))
		.map(([, entry]) => entry.level);
	if (levels.length === 0) return null;
	return levels.reduce((sum, level) => sum + level, 0) / levels.length;
}

// Ключ дня 2026-10-15 → дата по местному времени
export function parseDay(day: string) {
	const [year, month, date] = day.split('-').map(Number);
	return new Date(year, month - 1, date);
}

const fullDateFormat = new Intl.DateTimeFormat('ru', {
	day: 'numeric',
	month: 'long',
	year: 'numeric'
});

// Подпись клетки календаря для скринридера: «19 октября 2026, настроение: хорошо» или «…, без оценки».
// Заметка дня, если она есть, добавляется в конце
export function dayLabel(day: string, entry: MoodEntry | undefined) {
	const parts = fullDateFormat.formatToParts(parseDay(day));
	const part = (type: string) => parts.find((item) => item.type === type)?.value ?? '';
	// Без «г.» после года, которое добавляет Intl
	const date = `${part('day')} ${part('month')} ${part('year')}`;
	if (!entry) return `${date}, без оценки`;
	const level = moodLevels[entry.level - 1].label.toLowerCase();
	return `${date}, настроение: ${level}${entry.note ? `, заметка: ${entry.note}` : ''}`;
}
