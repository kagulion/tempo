import { formatDuration } from './format';
import { StatCard, StatLabel, StatValue } from './StatCard';

type TimeCardProps = {
	todayMs: number;
	totalMs: number;
};

// Время на сайте: сегодня и за всё время
export function TimeCard({ todayMs, totalMs }: TimeCardProps) {
	return (
		<StatCard className="flex">
			<div className="flex flex-1 items-start justify-between gap-3 sm:flex-col sm:justify-start sm:gap-2">
				<div className="flex flex-col gap-0.5">
					<StatLabel>Сегодня</StatLabel>
					<StatValue className="text-[15px]">{formatDuration(todayMs)}</StatValue>
				</div>
				<div className="flex flex-col items-end gap-0.5 sm:items-start">
					<StatLabel>Всего</StatLabel>
					<StatValue className="text-[15px]">{formatDuration(totalMs)}</StatValue>
				</div>
			</div>
		</StatCard>
	);
}
