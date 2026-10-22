import { useMemo } from 'react';

import { EffectCanvas } from './EffectCanvas';
import { effects } from './effects';
import { useEffectsOff } from './effectsOff';
import { useFrontEffectsSuppressed } from './frontSuppressed';
import { useActiveEffects } from './useActiveEffects';

// Холсты включённых эффектов: по одному на слой, не больше двух. Не перехватывают клики.
// Слой (поверх окон или под ними) задаёт сам эффект
export function EffectLayers() {
	const activeEffects = useActiveEffects();
	// «Без эффектов»: холстов нет вовсе, циклы отрисовки не крутятся. Выбор эффектов при этом не меняется
	const off = useEffectsOff();
	// Плеер Twitch просит убрать эффекты поверх окон: иначе он не играет. Эффекты под окнами остаются
	const frontSuppressed = useFrontEffectsSuppressed();

	const { active } = activeEffects;
	// Новый массив только при смене набора, чтобы холст не синхронизировался на каждый рендер
	const frontIds = useMemo(
		() => effects.filter((e) => e.layer === 'front' && active.includes(e.id)).map((e) => e.id),
		[active]
	);
	const backIds = useMemo(
		() => effects.filter((e) => e.layer === 'back' && active.includes(e.id)).map((e) => e.id),
		[active]
	);

	if (off) return null;

	return (
		<>
			{frontIds.length > 0 && !frontSuppressed && (
				<EffectCanvas ids={frontIds} layer="front" paused={activeEffects.paused} />
			)}
			{backIds.length > 0 && (
				<EffectCanvas ids={backIds} layer="back" paused={activeEffects.paused} />
			)}
		</>
	);
}
