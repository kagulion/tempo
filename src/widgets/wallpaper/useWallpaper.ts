import { useEffect, useState } from 'react';

import { type Faction, wallpapers } from './wallpapers';

const storageKey = 'tempo:wallpaper';

// Выбранная фракция и номер обоев в каждой из них: при возврате к фракции открываются её последние обои
type WallpaperState = {
	faction: Faction;
	indexes: Record<Faction, number>;
};

const defaultState: WallpaperState = {
	faction: 'horde',
	indexes: { alliance: 0, horde: 0 }
};

function load(): WallpaperState {
	try {
		const saved: Partial<WallpaperState> = JSON.parse(localStorage.getItem(storageKey) ?? '{}');
		const faction =
			saved.faction && saved.faction in wallpapers ? saved.faction : defaultState.faction;
		// Список обоев мог поменяться, поэтому номер за пределами списка сбрасываем на первые обои
		const indexes = { ...defaultState.indexes };
		for (const key of Object.keys(indexes) as Faction[]) {
			const index = saved.indexes?.[key];
			if (typeof index === 'number' && index >= 0 && index < wallpapers[key].length) {
				indexes[key] = Math.floor(index);
			}
		}
		return { faction, indexes };
	} catch {
		return defaultState;
	}
}

function save(state: WallpaperState) {
	try {
		localStorage.setItem(storageKey, JSON.stringify(state));
	} catch {
		// Хранилище недоступно (приватный режим) — после перезагрузки откроются обои по умолчанию
	}
}

export function useWallpaper() {
	const [state, setState] = useState(load);

	useEffect(() => save(state), [state]);

	const list = wallpapers[state.faction];
	const index = state.indexes[state.faction];

	function shift(step: number) {
		setState((prev) => {
			const length = wallpapers[prev.faction].length;
			const next = (prev.indexes[prev.faction] + step + length) % length;
			return { ...prev, indexes: { ...prev.indexes, [prev.faction]: next } };
		});
	}

	return {
		faction: state.faction,
		current: list[index],
		index,
		count: list.length,
		setFaction: (faction: Faction) => setState((prev) => ({ ...prev, faction })),
		next: () => shift(1),
		prev: () => shift(-1)
	};
}
