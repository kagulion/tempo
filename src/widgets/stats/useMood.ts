import { useState } from 'react';

import { usePersistentState } from '@/hooks/usePersistentState';
import { storageKeys } from '@/lib/storage';

import { parseMood, setMood, setNote, type MoodLevel } from './mood';

// Оценки настроения по дням, выбранный день и показываемый месяц.
// Новых таймеров нет: окно статистики и так перерисовывается каждую секунду, а useVisitStats каждый раз
// отдаёт актуальный день в lastDay, его и передаём как «сегодня»
export function useMood(today: string) {
	const [entries, setEntries] = usePersistentState(storageKeys.mood, {}, parseMood);
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
