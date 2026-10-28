import type { ComponentType } from 'react';

import { dateFormat, timeFormat } from '@/widgets/clock/time';
import { useNow } from '@/widgets/clock/useNow';

import type { OverlayId } from './settings';

// Крупные часы поверх страницы. BigClock рабочего стола не берём: он связан с радио и раскладкой окон
function ClockOverlay() {
	const now = useNow();
	return (
		<div className="pointer-events-none text-center select-none [text-shadow:0_2px_16px_rgba(0,0,0,0.6)]">
			<div className="text-6xl font-light tracking-tight tabular-nums sm:text-7xl">
				{timeFormat.format(now)}
			</div>
			<div className="mt-1 text-sm text-white/80 first-letter:uppercase sm:text-base">
				{dateFormat.format(now)}
			</div>
		</div>
	);
}

// Все виджеты поверх страницы. Новый: добавить в overlayList (settings.ts) и сюда
export const overlayComponents: Record<OverlayId, ComponentType> = {
	clock: ClockOverlay
};
