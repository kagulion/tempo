import { usePersistentState } from '@/hooks/usePersistentState';
import { storageKeys } from '@/lib/storage';

import type { RecordStation } from './record';
import { parseStationMap } from './saved';

export function useFavoriteStations() {
	// Избранные станции храним целиком, чтобы показать их без запроса к API.
	// Хранилище недоступно (приватный режим) — избранное живёт до перезагрузки
	const [favorites, setFavorites] = usePersistentState(
		storageKeys.favoriteStations,
		{},
		parseStationMap
	);

	function isFavorite(station: RecordStation | undefined) {
		return station ? String(station.id) in favorites : false;
	}

	function toggleFavorite(station: RecordStation) {
		setFavorites((current) => {
			const next = { ...current };
			const key = String(station.id);
			if (key in next) delete next[key];
			else next[key] = station;
			return next;
		});
	}

	return {
		// По алфавиту — для списка избранного
		favorites: Object.values(favorites).sort((a, b) => a.title.localeCompare(b.title)),
		isFavorite,
		toggleFavorite
	};
}
