import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from '@/App';
import { Embers } from '@/components/Embers';
import '@/index.css';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App />
		<Embers />
	</StrictMode>
);
