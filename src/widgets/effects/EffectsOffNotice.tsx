import { Button } from '@/components/ui/button';

import { toggleEffectsOff, useEffectsOff } from './effectsOff';

// Строка в окнах эффектов и затемнения: настройки можно менять, но пока включено «Без эффектов», их не видно
export function EffectsOffNotice() {
	const off = useEffectsOff();
	if (!off) return null;
	return (
		<div className="flex items-center justify-between gap-2 rounded-xl bg-white/5 py-1.5 pr-1.5 pl-3 text-xs text-white/60">
			Эффекты скрыты кнопкой в правом верхнем углу
			<Button variant="glass-solid" size="xs" onClick={toggleEffectsOff}>
				Показать
			</Button>
		</div>
	);
}
