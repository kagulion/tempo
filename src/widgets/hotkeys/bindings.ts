import { bindingName, staticHotkeys, widgetHotkeys, type HotkeyBinding } from '@/lib/hotkeys';
import { widgets } from '@/widgets/registry';

// Все горячие клавиши сайта: окна виджетов из реестра и общие действия (src/lib/hotkeys.ts)
export const hotkeyBindings: readonly HotkeyBinding[] = [
	...widgetHotkeys(widgets),
	...staticHotkeys
];

// Подпись клавиши действия для подсказок («F», «?»). undefined — у действия нет клавиши
export function hotkeyLabel(action: string): string | undefined {
	const binding = hotkeyBindings.find((item) => item.action === action);
	return binding ? bindingName(binding) : undefined;
}
