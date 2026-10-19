import { useEffect, useRef } from 'react';

import { siteHotkeysStore } from '@/lib/siteHotkeys';
import { matchHotkey, type HotkeyBinding } from '@/lib/hotkeys';

// Один слушатель keydown на странице: находит действие по клавише и вызывает onAction.
// Обработчик может меняться при каждой отрисовке, слушатель из-за этого не пересоздаётся
export function useHotkeys(bindings: readonly HotkeyBinding[], onAction: (action: string) => void) {
	const handler = useRef(onAction);
	useEffect(() => {
		handler.current = onAction;
	});

	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			const action = matchHotkey(event, bindings, siteHotkeysStore.get());
			if (action === undefined) return;
			event.preventDefault();
			handler.current(action);
		}
		document.addEventListener('keydown', onKeyDown);
		return () => document.removeEventListener('keydown', onKeyDown);
	}, [bindings]);
}
