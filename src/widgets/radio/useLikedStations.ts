import { usePersistentState } from '@/hooks/usePersistentState';
import { storageKeys } from '@/lib/storage';

import { parseLiked } from './stations';

// Станции, за которые посетитель проголосовал. Голос в Radio Browser отозвать нельзя,
// поэтому и здесь отметка остаётся насовсем
export function useLikedStations() {
	const [liked, setLiked] = usePersistentState(storageKeys.likedStations, {}, parseLiked);

	function isLiked(uuid: string | undefined) {
		return uuid ? uuid in liked : false;
	}

	function markLiked(uuid: string) {
		setLiked((current) => ({ ...current, [uuid]: Date.now() }));
	}

	return { isLiked, markLiked };
}
