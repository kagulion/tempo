import { cn } from '@/lib/utils';
import { Widget, WidgetTitle } from '@/widgets/Widget';

import { MoodCard } from './MoodCard';
import { OnlineCard } from './OnlineCard';
import { StreakCard } from './StreakCard';
import { TimeCard } from './TimeCard';
import { useOnline } from './useOnline';
import { useVisitStats } from './useVisitStats';

type StatsWidgetProps = {
	className?: string;
};

// Окно статистики: карточки онлайна, серии дней, времени на сайте и настроения.
// С sm — две колонки: слева онлайн, серия и время столбиком (12rem, значения не переносятся: пары серия/рекорд и сегодня/всего стоят друг под другом), справа настроение с календарём; на телефоне один столбец
export function StatsWidget({ className }: StatsWidgetProps) {
	const online = useOnline();
	const stats = useVisitStats();

	return (
		<Widget aria-label="Статистика" className={cn('flex flex-col gap-2.5 p-4', className)}>
			<h2 className="m-0 text-xs font-medium">
				<WidgetTitle>Статистика</WidgetTitle>
			</h2>

			{/* items-start: колонки не растягивают карточки друг до друга */}
			<div className="flex flex-col gap-2.5 sm:grid sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-start">
				<div className="flex flex-col gap-2.5">
					<OnlineCard count={online} />
					<StreakCard streak={stats.streak} best={stats.best} />
					<TimeCard todayMs={stats.todayMs} totalMs={stats.totalMs} />
				</div>
				<MoodCard today={stats.lastDay} />
			</div>
		</Widget>
	);
}
