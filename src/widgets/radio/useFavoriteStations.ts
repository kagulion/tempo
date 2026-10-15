import { usePersistentState } from '@/hooks/usePersistentState';
import { storageKeys } from '@/lib/storage';

import { parseStationMap, type Station } from './stations';

export function useFavoriteStations() {
	// Избранные станции храним целиком, чтобы потом показать их без запроса к API.
	// Хранилище недоступно (приватный режим) — избранное живёт до перезагрузки
	const [favorites, setFavorites] = usePersistentState(
		storageKeys.favoriteStations,
		{},
		parseStationMap
	);

	function isFavorite(station: Station | undefined) {
		return station ? station.stationuuid in favorites : false;
	}

	function toggleFavorite(station: Station) {
		setFavorites((current) => {
			const next = { ...current };
			if (station.stationuuid in next) delete next[station.stationuuid];
			else next[station.stationuuid] = station;
			return next;
		});
	}

	return {
		// По алфавиту — для списка избранного
		favorites: Object.values(favorites).sort((a, b) => a.name.localeCompare(b.name)),
		isFavorite,
		toggleFavorite
	};
}
