import { StrictMode } from 'react';

import App from '@/App';

// Обёртка для Astro: острову нужен один корневой компонент, а StrictMode оставляем как был
export default function Root() {
	return (
		<StrictMode>
			<App />
		</StrictMode>
	);
}
