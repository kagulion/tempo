import { dimmerOpacity } from './dimmer';
import { useDimmer } from './useDimmer';

// Чёрный слой над обоями и под всем остальным. При 0 в DOM его нет
export function DimmerLayer() {
	const { value } = useDimmer();
	if (value === 0) return null;
	return (
		<div
			aria-hidden="true"
			className="pointer-events-none absolute inset-0 bg-black transition-opacity duration-300"
			style={{ opacity: dimmerOpacity(value) }}
		/>
	);
}
