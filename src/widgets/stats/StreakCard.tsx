import { Flame } from 'lucide-react';

import { formatDays } from './format';
import { StatCard, StatLabel, StatValue } from './StatCard';

type StreakCardProps = {
	streak: number;
	best: number;
};

// Серия дней подряд с заходом на сайт и рекорд
export function StreakCard({ streak, best }: StreakCardProps) {
	return (
		<StatCard className="flex items-start justify-between gap-3 sm:flex-col sm:justify-start sm:gap-2">
			<div className="flex flex-col gap-0.5">
				<StatLabel>Серия дней</StatLabel>
				<StatValue className="text-[15px]">
					{formatDays(streak)}
					<Flame className="size-4 text-orange-400" aria-hidden />
				</StatValue>
			</div>
			<div className="flex flex-col items-end gap-0.5 sm:items-start">
				<StatLabel>Рекорд</StatLabel>
				<StatValue className="text-[15px]">{formatDays(best)}</StatValue>
			</div>
		</StatCard>
	);
}
