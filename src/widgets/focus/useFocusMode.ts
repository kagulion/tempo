import { useCallback, useEffect, useState } from 'react';

import type { FocusMode } from './focus';

// Состояние режима фокуса. Не сохраняется: после перезагрузки страница всегда в обычном режиме
export function useFocusMode() {
	const [mode, setMode] = useState<FocusMode>('off');

	// Кнопка: обычный ↔ всё скрыто, из «только часы» — обратно в обычный
	const toggle = useCallback(() => setMode((current) => (current === 'off' ? 'all' : 'off')), []);
	const enterClockOnly = useCallback(() => setMode('clock'), []);
	const exit = useCallback(() => setMode('off'), []);

	// Esc выходит из фокуса; слушатель нужен только пока режим включён
	const active = mode !== 'off';
	useEffect(() => {
		if (!active) return;
		function onKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') exit();
		}
		document.addEventListener('keydown', onKeyDown);
		return () => document.removeEventListener('keydown', onKeyDown);
	}, [active, exit]);

	return { mode, toggle, enterClockOnly, exit };
}
