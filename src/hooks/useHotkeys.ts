import { useEffect, useRef } from 'react';

import { siteHotkeysStore } from '@/lib/siteHotkeys';
import { matchHotkey, type HotkeyBinding } from '@/lib/hotkeys';

// Один слушатель keydown на странице: находит действие по клавише и вызывает onAction.
// skip — необязательная проверка: если вернула true, клавиша остаётся браузеру (например, пробел на кнопке).
// Обработчик может меняться при каждой отрисовке, слушатель из-за этого не пересоздаётся
export function useHotkeys(
	bindings: readonly HotkeyBinding[],
	onAction: (action: string) => void,
	skip?: (event: KeyboardEvent) => boolean
) {
	const handler = useRef(onAction);
	const skipRef = useRef(skip);
	useEffect(() => {
		handler.current = onAction;
		skipRef.current = skip;
	});

	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if (skipRef.current?.(event)) return;
			const action = matchHotkey(event, bindings, siteHotkeysStore.get());
			if (action === undefined) return;
			event.preventDefault();
			handler.current(action);
		}
		document.addEventListener('keydown', onKeyDown);
		return () => document.removeEventListener('keydown', onKeyDown);
	}, [bindings]);
}
