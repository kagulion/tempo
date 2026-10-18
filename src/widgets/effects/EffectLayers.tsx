import { EffectCanvas } from './EffectCanvas';
import { effects } from './effects';
import { useEffectsOff } from './effectsOff';
import { useFrontEffectsSuppressed } from './frontSuppressed';
import { useActiveEffects } from './useActiveEffects';

// Холсты всех включённых эффектов. Не перехватывают клики. Слой (поверх окон или под ними) задаёт сам эффект
export function EffectLayers() {
	const activeEffects = useActiveEffects();
	// «Без эффектов»: холстов нет вовсе, циклы отрисовки не крутятся. Выбор эффектов при этом не меняется
	const off = useEffectsOff();
	// Плеер Twitch просит убрать эффекты поверх окон: иначе он не играет. Эффекты под окнами остаются
	const frontSuppressed = useFrontEffectsSuppressed();
	if (off) return null;

	return (
		<>
			{effects
				.filter(
					(effect) =>
						activeEffects.isActive(effect.id) && !(frontSuppressed && effect.layer === 'front')
				)
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
