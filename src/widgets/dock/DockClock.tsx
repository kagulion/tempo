import { cn } from '@/lib/utils';
import { timeFormat } from '@/widgets/clock/time';
import { useBigClock } from '@/widgets/clock/useBigClock';
import { useNow } from '@/widgets/clock/useNow';

type DockClockProps = {
	className?: string;
};

// Текущее время с компьютера. По клику показывает или прячет крупные часы посередине экрана (src/widgets/clock/BigClock.tsx).
// На телефоне скрыто: панель не влезает, а часы есть в статус-баре
export function DockClock({ className }: DockClockProps) {
	const now = useNow();
	const bigClock = useBigClock();
	const label = bigClock.shown ? 'Скрыть крупные часы' : 'Крупные часы';

	return (
		<button
			type="button"
			onClick={bigClock.toggle}
			aria-pressed={bigClock.shown}
			title={label}
			aria-label={`${timeFormat.format(now)}, ${label.toLowerCase()}`}
			className={cn(
				className,
				'hidden w-auto px-2.5 text-sm font-medium text-white/80 tabular-nums sm:flex',
				bigClock.shown && 'bg-white/20 text-white'
			)}
		>
			<time dateTime={now.toISOString()}>{timeFormat.format(now)}</time>
		</button>
	);
}
