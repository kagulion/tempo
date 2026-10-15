import { cn } from '@/lib/utils';

import { dateFormat, timeFormat } from './time';
import { useBigClock } from './useBigClock';
import { useNow } from './useNow';

// Крупное время посередине экрана, включается кликом по часам на панели.
// Над обоями и задними эффектами, под окнами (z-10), клики не перехватывает.
// На телефоне скрыто, как и часы на панели, которые его включают.
// visibility задаёт режим фокуса: 'user' — по настройке, 'force' — показать всегда (и на телефоне), 'hide' — скрыть.
// Сохранённую настройку это не меняет
type BigClockProps = {
	visibility: 'user' | 'force' | 'hide';
};

export function BigClock({ visibility }: BigClockProps) {
	const { shown } = useBigClock();

	if (visibility === 'hide') return null;
	if (visibility === 'user' && !shown) return null;
	return <BigClockFace forced={visibility === 'force'} />;
}

// Отдельный компонент, чтобы пока часы скрыты, таймер useNow не крутился
function BigClockFace({ forced }: { forced: boolean }) {
	const now = useNow();

	return (
		<div
			className={cn(
				'pointer-events-none absolute inset-0 z-[5] flex-col items-center justify-center text-white drop-shadow-[0_2px_24px_rgb(0_0_0/0.6)] select-none',
				forced ? 'flex' : 'hidden sm:flex'
			)}
		>
			<time
				dateTime={now.toISOString()}
				className="text-[min(15vw,10rem)] leading-none font-extralight tracking-tight tabular-nums"
			>
				{timeFormat.format(now)}
			</time>
			<span className="mt-2 text-lg font-light text-white/80 lg:text-xl">
				{dateFormat.format(now)}
			</span>
		</div>
	);
}
