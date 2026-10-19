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
	return <span aria-hidden className="h-4 w-px bg-white/30" />;
}

// Ключевые цифры статистики в углу экрана: онлайн, серия дней и настроение за месяц (только смайлик).
// Не нажимается — просто подпись поверх обоев на тёмной стеклянной подложке, чтобы читалась на светлых обоях.
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
				'flex h-9 items-center gap-3 rounded-full bg-black/65 px-3 text-sm font-medium text-white/90 tabular-nums backdrop-blur-md select-none',
				className
			)}
		>
			<span className="flex items-center gap-1.5">
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
			<span className="flex items-center gap-1">
				<Flame className="size-3.5 text-orange-400" aria-hidden />
				<span aria-hidden>{stats.streak}</span>
				<span className="sr-only">{streakLabel}</span>
			</span>
			<Divider />
			<span className="flex items-center">
				<span aria-hidden>{moodLevel ? moodLevel.emoji : '—'}</span>
				<span className="sr-only">{moodLabel}</span>
			</span>
		</div>
	);
}
