import { EffectCanvas } from './EffectCanvas';
import { effects } from './effects';
import { useActiveEffects } from './useActiveEffects';

// Холсты всех включённых эффектов. Не перехватывают клики. Слой (поверх окон или под ними) задаёт сам эффект
export function EffectLayers() {
	const activeEffects = useActiveEffects();

	return (
		<>
			{effects
				.filter((effect) => activeEffects.isActive(effect.id))
				.map((effect) => (
					<EffectCanvas
						key={effect.id}
						create={effect.create}
						layer={effect.layer}
						paused={activeEffects.paused}
					/>
				))}
		</>
	);
}
