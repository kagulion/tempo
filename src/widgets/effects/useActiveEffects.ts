import { useEffect, useState } from 'react';

import { type EffectId, effects } from './effects';

const storageKey = 'tempo:effects';
// Первый визит: как было до окна эффектов, только огоньки
const defaultActive: EffectId[] = ['embers'];

function load(): EffectId[] {
	try {
		const saved = localStorage.getItem(storageKey);
		if (!saved) return defaultActive;
		const list: unknown = JSON.parse(saved);
		// Эффект могли убрать из списка — неизвестные id отбрасываем
		return Array.isArray(list)
			? effects.map((item) => item.id).filter((id) => list.includes(id))
			: defaultActive;
	} catch {
		return defaultActive;
	}
}

// Какие эффекты включены. Можно несколько сразу или ни одного
export function useActiveEffects() {
	const [active, setActive] = useState(load);

	useEffect(() => {
		try {
			localStorage.setItem(storageKey, JSON.stringify(active));
		} catch {
			// Хранилище недоступно (приватный режим) — после перезагрузки включатся эффекты по умолчанию
		}
	}, [active]);

	return {
		active,
		isActive: (id: EffectId) => active.includes(id),
		toggle: (id: EffectId) =>
			setActive((list) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]))
	};
}
