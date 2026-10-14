import { useCallback, useSyncExternalStore } from 'react';

import { matchesMedia } from '@/lib/media';

// Совпадает ли медиазапрос сейчас. Перерисовывает компонент, когда ответ меняется.
// Запросы — в mediaQueries из src/lib/media.ts
export function useMediaQuery(query: string) {
	const subscribe = useCallback(
		(listener: () => void) => {
			const media = window.matchMedia(query);
			media.addEventListener('change', listener);
			return () => media.removeEventListener('change', listener);
		},
		[query]
	);

	return useSyncExternalStore(subscribe, () => matchesMedia(query));
}
