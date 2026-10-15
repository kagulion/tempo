import { Clock } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useBigClock } from '@/widgets/clock/useBigClock';

type DockClockProps = {
	className?: string;
};

// Кнопка с иконкой часов. По клику показывает или прячет крупные часы — в центре или свёрнутые наверху (src/widgets/clock/BigClock.tsx).
// Стиль кнопки приходит из className (buttonClass в Dock.tsx), как у кнопок окон. На телефоне скрыто: панель не влезает, а часы есть в статус-баре
export function DockClock({ className }: DockClockProps) {
	const bigClock = useBigClock();
	const label = bigClock.shown ? 'Скрыть крупные часы' : 'Крупные часы';

	return (
		<button
			type="button"
			onClick={bigClock.toggle}
			aria-pressed={bigClock.shown}
			title={label}
			aria-label={label}
			className={cn(className, 'hidden sm:flex', bigClock.shown && 'bg-white/20 text-white')}
		>
			<Clock className="size-4" />
		</button>
	);
}
