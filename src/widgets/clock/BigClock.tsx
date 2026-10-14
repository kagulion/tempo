import { dateFormat, timeFormat } from './time';
import { useBigClock } from './useBigClock';
import { useNow } from './useNow';

// Крупное время посередине экрана, включается кликом по часам на панели.
// Над обоями и задними эффектами, под окнами (z-10), клики не перехватывает.
// На телефоне скрыто, как и часы на панели, которые его включают
export function BigClock() {
	const { shown } = useBigClock();

	if (!shown) return null;
	return <BigClockFace />;
}

// Отдельный компонент, чтобы пока часы скрыты, таймер useNow не крутился
function BigClockFace() {
	const now = useNow();

	return (
		<div className="pointer-events-none absolute inset-0 z-[5] hidden flex-col items-center justify-center text-white drop-shadow-[0_2px_24px_rgb(0_0_0/0.6)] select-none sm:flex">
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
