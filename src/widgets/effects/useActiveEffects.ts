import { useSyncExternalStore } from 'react';

import { createPersistentStore, isRecord, storageKeys } from '@/lib/storage';

import { type EffectId, effects } from './effects';

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

export function parseState(saved: unknown): EffectsState | undefined {
	// Раньше хранился только массив включённых id
	if (Array.isArray(saved)) return { active: knownIds(saved), paused: false };
	if (!isRecord(saved)) return undefined;
	return { active: knownIds(saved.active), paused: saved.paused === true };
}

// Общее для окна эффектов и холстов (EffectLayers). Хранилище недоступно (приватный режим) —
// после перезагрузки включатся эффекты по умолчанию
const store = createPersistentStore(storageKeys.effects, defaultState, parseState);

// Какие эффекты включены (можно несколько сразу или ни одного) и стоят ли они на паузе
export function useActiveEffects() {
	const state = useSyncExternalStore(store.subscribe, store.get);
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
			store.set((current) =>
				current.active.includes(id)
					? { ...current, active: current.active.filter((item) => item !== id) }
					: { active: [...current.active, id], paused: false }
			),
		togglePaused: () => store.set((current) => ({ ...current, paused: !current.paused })),
		// Выключает все эффекты
		reset: () => store.set({ active: [], paused: false })
	};
}
