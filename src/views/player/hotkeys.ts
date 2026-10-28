import { bindingName, staticHotkeys, type HotkeyBinding, type HotkeyGroup } from '@/lib/hotkeys';

// Клавиши страницы /player. Механизм общий с рабочим столом (src/lib/hotkeys.ts, useHotkeys), набор свой.
// «На весь экран» и «?» берём из общих действий, чтобы клавиши были те же, что на рабочем столе
export const playerHotkeys: readonly HotkeyBinding[] = [
	{ action: 'collection', code: 'Digit1', label: 'Коллекция', group: 'windows' },
	{ action: 'togglePlay', code: 'Space', label: 'Пауза и воспроизведение', group: 'player' },
	{ action: 'seekBack', code: 'ArrowLeft', label: 'Назад на 10 секунд', group: 'player' },
	{ action: 'seekForward', code: 'ArrowRight', label: 'Вперёд на 10 секунд', group: 'player' },
	{ action: 'next', code: 'KeyN', label: 'Следующая пластинка', group: 'player' },
	{ action: 'previous', code: 'KeyP', label: 'Предыдущая пластинка', group: 'player' },
	...staticHotkeys.filter((binding) => binding.action === 'fullscreen' || binding.action === 'help')
];

// Подпись клавиши окна коллекции для подсказки на панели
export const collectionHotkeyLabel = bindingName({ code: 'Digit1' });

// Группы списка клавиш проигрывателя в порядке показа
export const playerHotkeyGroups: readonly HotkeyGroup[] = ['windows', 'player', 'view', 'other'];

// Шаг перемотки клавишами ← и →, секунды
export const seekStep = 10;

// Пробел на кнопке, ссылке и пункте меню нажимает их, а не ставит паузу. Остальные клавиши, которые
// уже обработал кто-то другой (меню, ползунок), тоже оставляем ему
export function skipPlayerHotkey(event: KeyboardEvent): boolean {
	if (event.defaultPrevented) return true;
	const target = event.target instanceof HTMLElement ? event.target : undefined;
	return event.code === 'Space' && Boolean(target?.closest('button, a, [role^="menuitem"]'));
}
