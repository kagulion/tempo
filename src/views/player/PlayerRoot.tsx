import { StrictMode } from 'react';

import PlayerView from './PlayerView';

// Обёртка для Astro: острову нужен один корневой компонент, а StrictMode оставляем как у рабочего стола
export default function PlayerRoot() {
	return (
		<StrictMode>
			<PlayerView />
		</StrictMode>
	);
}
