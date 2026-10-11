import { useEffect, useState } from 'react';

import type { Station } from './api';

const storageKey = 'tempo:favorite-stations';

// Избранные станции храним целиком, чтобы потом показать их без запроса к API
function loadFavorites(): Record<string, Station> {
	try {
		return JSON.parse(localStorage.getItem(storageKey) ?? '{}');
	} catch {
		return {};
	}
}

export function useFavoriteStations() {
	const [favorites, setFavorites] = useState(loadFavorites);

	useEffect(() => {
		try {
			localStorage.setItem(storageKey, JSON.stringify(favorites));
		} catch {
			// Хранилище недоступно (приватный режим) — избранное живёт до перезагрузки
		}
	}, [favorites]);

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
