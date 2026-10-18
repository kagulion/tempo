import { useEffectsOff } from '@/widgets/effects/effectsOff';

import { dimmerOpacity } from './dimmer';
import { useDimmer } from './useDimmer';

// Чёрный слой над обоями и под всем остальным. При 0 и в режиме «без эффектов» в DOM его нет
export function DimmerLayer() {
	const { value } = useDimmer();
	// «Без эффектов» убирает и затемнение, а ползунок остаётся на месте
	const off = useEffectsOff();
	if (value === 0 || off) return null;
	return (
		<div
			aria-hidden="true"
			className="pointer-events-none absolute inset-0 bg-black transition-opacity duration-300"
			style={{ opacity: dimmerOpacity(value) }}
		/>
	);
}
