import { Hourglass } from 'lucide-react';

import { formatDuration } from './format';
import { StatCard, StatLabel, StatValue } from './StatCard';

type TimeCardProps = {
	todayMs: number;
	totalMs: number;
};

// Время на сайте: сегодня и за всё время
export function TimeCard({ todayMs, totalMs }: TimeCardProps) {
	return (
		<StatCard className="flex items-center gap-3">
			<Hourglass className="size-5 shrink-0 text-white/40" aria-hidden />
			<div className="flex flex-1 items-start justify-between gap-3">
				<div className="flex flex-col gap-0.5">
					<StatLabel>Сегодня</StatLabel>
					<StatValue>{formatDuration(todayMs)}</StatValue>
				</div>
				<div className="flex flex-col items-end gap-0.5">
					<StatLabel>Всего</StatLabel>
					<StatValue>{formatDuration(totalMs)}</StatValue>
				</div>
			</div>
		</StatCard>
	);
}
