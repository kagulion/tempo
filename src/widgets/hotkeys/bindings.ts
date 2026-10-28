import {
	bindingName,
	staticHotkeys,
	widgetHotkeys,
	type HotkeyBinding,
	type HotkeyGroup
} from '@/lib/hotkeys';
import { widgets } from '@/widgets/registry';

// Все горячие клавиши сайта: окна виджетов из реестра и общие действия (src/lib/hotkeys.ts)
export const hotkeyBindings: readonly HotkeyBinding[] = [
	...widgetHotkeys(widgets),
	...staticHotkeys
];

// Группы списка клавиш рабочего стола в порядке показа
export const hotkeyGroups: readonly HotkeyGroup[] = ['windows', 'view', 'other'];

// Подпись клавиши действия для подсказок («F», «?»). undefined — у действия нет клавиши
export function hotkeyLabel(action: string): string | undefined {
	const binding = hotkeyBindings.find((item) => item.action === action);
	return binding ? bindingName(binding) : undefined;
}
