import { Flame } from 'lucide-react';

import { cn } from '@/lib/utils';

import { moodLevels } from './mood';
import { useMonthMoodAverage } from './useMood';
import { useOnline } from './useOnline';
import { useVisitStats } from './useVisitStats';

const averageFormat = new Intl.NumberFormat('ru', { maximumFractionDigits: 1 });

type StatsHighlightsProps = {
	className?: string;
};

function Divider() {
	return <span aria-hidden className="h-4 w-px bg-white/25" />;
}

// Ключевые цифры статистики в углу экрана: онлайн, серия дней и настроение за месяц (только смайлик).
// Без фона и обводки, не нажимается — просто подпись поверх обоев, тень держит читаемость.
// Данные берутся из тех же общих хранилищ, что и окно статистики, так что цифры всегда совпадают.
// Видимое скрыто от скринридера, вместо него — полные подписи в sr-only
export function StatsHighlights({ className }: StatsHighlightsProps) {
	const online = useOnline();
	const stats = useVisitStats();
	const average = useMonthMoodAverage(stats.lastDay);

	const onlineLabel = `Сейчас на сайте: ${online ?? '—'}`;
	const streakLabel = `Серия дней: ${stats.streak}`;
	const moodLevel = average === null ? null : moodLevels[Math.round(average) - 1];
	const moodLabel = `Настроение за месяц: ${average === null ? 'нет оценок' : `${moodLevel?.label}, ${averageFormat.format(average)}`}`;

	return (
		<div
			role="group"
			aria-label="Статистика"
			className={cn(
				'flex h-9 items-center gap-3 px-1 text-sm font-medium text-white/90 tabular-nums drop-shadow-[0_1px_4px_rgb(0_0_0/0.8)] select-none',
				className
			)}
		>
			<span className="flex items-center gap-1.5" title={onlineLabel}>
				<span
					aria-hidden
					className={cn(
						'size-1.5 rounded-full',
						online === null ? 'bg-white/30' : 'bg-emerald-400'
					)}
				/>
				<span aria-hidden>{online ?? '—'}</span>
				<span className="sr-only">{onlineLabel}</span>
			</span>
			<Divider />
			<span className="flex items-center gap-1" title={streakLabel}>
				<Flame className="size-3.5 text-orange-400" aria-hidden />
				<span aria-hidden>{stats.streak}</span>
				<span className="sr-only">{streakLabel}</span>
			</span>
			<Divider />
			<span className="flex items-center" title={moodLabel}>
				<span aria-hidden>{moodLevel ? moodLevel.emoji : '—'}</span>
				<span className="sr-only">{moodLabel}</span>
			</span>
		</div>
	);
}
