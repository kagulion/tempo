import { useEffect, useState } from 'react';

import { type EffectId, effects } from './effects';

const storageKey = 'tempo:effects';

type EffectsState = {
	active: EffectId[];
	// Пауза замораживает включённые эффекты на месте, не выключая их
	paused: boolean;
};

// Первый визит: как было до окна эффектов, только огоньки
const defaultState: EffectsState = { active: ['embers'], paused: false };

// Эффект могли убрать из списка — неизвестные id отбрасываем
function knownIds(list: unknown): EffectId[] {
	return Array.isArray(list)
		? effects.map((item) => item.id).filter((id) => list.includes(id))
		: [];
}

function load(): EffectsState {
	try {
		const saved = localStorage.getItem(storageKey);
		if (!saved) return defaultState;
		const parsed = JSON.parse(saved);
		// Раньше хранился только массив включённых id
		if (Array.isArray(parsed)) return { active: knownIds(parsed), paused: false };
		return { active: knownIds(parsed.active), paused: parsed.paused === true };
	} catch {
		return defaultState;
	}
}

// Какие эффекты включены (можно несколько сразу или ни одного) и стоят ли они на паузе
export function useActiveEffects() {
	const [state, setState] = useState(load);

	useEffect(() => {
		try {
			localStorage.setItem(storageKey, JSON.stringify(state));
		} catch {
			// Хранилище недоступно (приватный режим) — после перезагрузки включатся эффекты по умолчанию
		}
	}, [state]);

	const anyActive = state.active.length > 0;

	return {
		active: state.active,
		anyActive,
		paused: state.paused && anyActive,
		// Эффекты сейчас идут. Как у звуков: без включённых эффектов кнопка показывает «играть», а не «пауза»
		playing: anyActive && !state.paused,
		isActive: (id: EffectId) => state.active.includes(id),
		// Включённый эффект снимает паузу — как включённый звук запускает остальные звуки
		toggle: (id: EffectId) =>
			setState((current) =>
				current.active.includes(id)
					? { ...current, active: current.active.filter((item) => item !== id) }
					: { active: [...current.active, id], paused: false }
			),
		togglePaused: () => setState((current) => ({ ...current, paused: !current.paused })),
		// Выключает все эффекты
		reset: () => setState({ active: [], paused: false })
	};
}
