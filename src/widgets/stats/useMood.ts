import { useState, useSyncExternalStore } from 'react';

import { createPersistentStore, storageKeys } from '@/lib/storage';

import {
	monthAverage,
	parseMood,
	setMood,
	setNote,
	type MoodEntries,
	type MoodLevel
} from './mood';

// Оценки настроения общие для карточки в окне статистики и хайлайтов в углу экрана:
// оценка, поставленная в карточке, сразу видна в хайлайте
const moodStore = createPersistentStore<MoodEntries>(storageKeys.mood, {}, parseMood);

function useMoodEntries() {
	return useSyncExternalStore(moodStore.subscribe, moodStore.get);
}

// Среднее настроение за текущий месяц; null, если оценок нет.
// today — сегодняшний день в формате dayKey (useVisitStats отдаёт его в lastDay)
export function useMonthMoodAverage(today: string) {
	const entries = useMoodEntries();
	const [year, month] = today.split('-').map(Number);
	return monthAverage(entries, year, month - 1);
}

// Оценки настроения по дням, выбранный день и показываемый месяц.
// Новых таймеров нет: окно статистики и так перерисовывается каждую секунду, а useVisitStats каждый раз
// отдаёт актуальный день в lastDay, его и передаём как «сегодня»
export function useMood(today: string) {
	const entries = useMoodEntries();
	const setEntries = moodStore.set;
	// null — «сегодня», чтобы выбор не залипал на вчера, если сайт открыт через полночь
	const [picked, setPicked] = useState<string | null>(null);
	const [view, setView] = useState(() => {
		const now = new Date();
		return { year: now.getFullYear(), month: now.getMonth() };
	});

	const day = picked ?? today;
	const [todayYear, todayMonth] = today.split('-').map(Number);
	const isCurrentMonth = view.year === todayYear && view.month === todayMonth - 1;

	function selectDay(next: string) {
		// Будущий день выбрать нельзя
		if (next > today) return;
		setPicked(next === today ? null : next);
	}

	function shiftMonth(delta: -1 | 1) {
		if (delta === 1 && isCurrentMonth) return;
		const date = new Date(view.year, view.month + delta, 1);
		setView({ year: date.getFullYear(), month: date.getMonth() });
	}

	return {
		entries,
		today,
		day,
		view,
		canGoForward: !isCurrentMonth,
		selectDay,
		shiftMonth,
		rate: (level: MoodLevel) => setEntries((current) => setMood(current, day, level)),
		saveNote: (note: string) => setEntries((current) => setNote(current, day, note))
	};
}
