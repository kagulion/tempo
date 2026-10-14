import { cn } from '@/lib/utils';
import { Widget, WidgetTitle } from '@/widgets/Widget';

import { OnlineCard } from './OnlineCard';
import { StreakCard } from './StreakCard';
import { TimeCard } from './TimeCard';
import { useOnline } from './useOnline';
import { useVisitStats } from './useVisitStats';

type StatsWidgetProps = {
	className?: string;
};

// Окно статистики: собирает карточки онлайна, серии дней и времени на сайте
export function StatsWidget({ className }: StatsWidgetProps) {
	const online = useOnline();
	const stats = useVisitStats();

	return (
		<Widget aria-label="Статистика" className={cn('flex flex-col gap-2.5 p-4', className)}>
			<div className="flex flex-col">
				<WidgetTitle>Статистика</WidgetTitle>
				<span className="text-xs text-white/40">Серия дней и время на сайте</span>
			</div>

			<OnlineCard count={online} />
			<StreakCard streak={stats.streak} best={stats.best} />
			<TimeCard todayMs={stats.todayMs} totalMs={stats.totalMs} />
		</Widget>
	);
}
