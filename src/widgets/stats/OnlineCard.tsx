import { Users } from 'lucide-react';

import { cn } from '@/lib/utils';

import { StatCard, StatLabel, StatValue } from './StatCard';

type OnlineCardProps = {
	// null — ещё подключаемся к сервису присутствия
	count: number | null;
};

// Сколько пользователей сейчас на сайте, с мигающей точкой «в эфире»
export function OnlineCard({ count }: OnlineCardProps) {
	return (
		<StatCard className="flex items-center justify-between gap-3">
			<div className="flex flex-col gap-0.5">
				<StatLabel>Сейчас на сайте</StatLabel>
				<StatValue>
					<span className="relative flex size-2" aria-hidden>
						<span
							className={cn(
								'absolute inline-flex size-full rounded-full bg-emerald-400 opacity-75',
								count !== null && 'animate-ping'
							)}
						/>
						<span
							className={cn(
								'relative inline-flex size-2 rounded-full',
								count === null ? 'bg-white/30' : 'bg-emerald-400'
							)}
						/>
					</span>
					<span aria-live="polite">{count ?? '—'}</span>
				</StatValue>
			</div>
			<Users className="size-5 text-white/40" aria-hidden />
		</StatCard>
	);
}
