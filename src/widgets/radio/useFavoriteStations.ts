import { usePersistentState } from '@/hooks/usePersistentState';
import { isRecord, storageKeys } from '@/lib/storage';

import type { Station } from './api';

function parseFavorites(saved: unknown): Record<string, Station> | undefined {
	return isRecord(saved) ? (saved as Record<string, Station>) : undefined;
}

export function useFavoriteStations() {
	// Избранные станции храним целиком, чтобы потом показать их без запроса к API.
	// Хранилище недоступно (приватный режим) — избранное живёт до перезагрузки
	const [favorites, setFavorites] = usePersistentState(
		storageKeys.favoriteStations,
		{},
		parseFavorites
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
