// Горячие клавиши сайта: описание и сопоставление с событием. Без React, чтобы можно было тестировать.
// Клавиши сравниваем по event.code (KeyR, Digit1), а не по event.key: так они работают в любой раскладке

export type HotkeyGroup = 'windows' | 'view' | 'other';

export const hotkeyGroupLabels: Record<HotkeyGroup, string> = {
	windows: 'Окна',
	view: 'Вид',
	other: 'Прочее'
};

export type HotkeyBinding = {
	// Что делает клавиша: widget:<id окна> или одно из действий ниже
	action: string;
	// event.code, например 'KeyF' или 'Digit1'
	code: string;
	// Нужен ли Shift. Остальные модификаторы (Ctrl, Alt, Meta) клавиши сайта не используют
	shift?: boolean;
	label: string;
	group: HotkeyGroup;
};

// Действия, не связанные с окнами. Клавиши окон берутся из реестра (поле hotkey в src/widgets/registry.ts)
export const staticHotkeys = [
	{ action: 'focus', code: 'KeyZ', label: 'Режим фокуса', group: 'view' },
	{ action: 'fullscreen', code: 'KeyF', label: 'На весь экран', group: 'view' },
	{ action: 'scenes', code: 'KeyS', label: 'Сменить сцену', group: 'view' },
	{ action: 'bigClock', code: 'KeyC', label: 'Крупные часы', group: 'view' },
	{ action: 'effectsOff', code: 'KeyE', label: 'Без эффектов', group: 'view' },
	{ action: 'help', code: 'Slash', shift: true, label: 'Список горячих клавиш', group: 'other' },
	{ action: 'soundMuted', code: 'KeyM', label: 'Без звука', group: 'other' },
	{ action: 'clickSounds', code: 'KeyK', label: 'Звуки нажатий', group: 'other' }
] as const satisfies readonly HotkeyBinding[];

type WidgetHotkeySource = { id: string; label: string; hotkey?: string };

// Клавиши окон виджетов: 'widget:<id>'
export function widgetHotkeys(sources: readonly WidgetHotkeySource[]): HotkeyBinding[] {
	return sources.flatMap((source) =>
		source.hotkey
			? [
					{
						action: `widget:${source.id}`,
						code: source.hotkey,
						label: source.label,
						group: 'windows'
					}
				]
			: []
	);
}

// Подпись клавиши для людей: латиницей или символом, не зависит от раскладки
export function keyName(code: string): string {
	if (code.startsWith('Key')) return code.slice(3);
	if (code.startsWith('Digit')) return code.slice(5);
	const names: Record<string, string> = {
		Slash: '/',
		Escape: 'Esc',
		Space: 'Пробел'
	};
	return names[code] ?? code;
}

// Подпись сочетания: «?» для Shift+/, «Shift+K» для остальных
export function bindingName(binding: Pick<HotkeyBinding, 'code' | 'shift'>): string {
	if (binding.code === 'Slash' && binding.shift) return '?';
	return binding.shift ? `Shift+${keyName(binding.code)}` : keyName(binding.code);
}

// Фокус в поле ввода: буквы тогда печатаются, а не вызывают действия
export function isTypingTarget(target: EventTarget | null): boolean {
	if (typeof Element === 'undefined' || !(target instanceof Element)) return false;
	return Boolean(
		target.closest(
			'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="combobox"]'
		)
	);
}

type KeyEventLike = Pick<
	KeyboardEvent,
	'code' | 'shiftKey' | 'ctrlKey' | 'altKey' | 'metaKey' | 'repeat' | 'target'
>;

// Срабатывает ли привязка вообще. Все привязки сайта — одиночные символьные клавиши, поэтому когда
// «Клавиши сайта» выключены (WCAG 2.1.4), не срабатывает ни одна. Проверка здесь одна, новые привязки подчиняются сами
export function isHotkeyActive(_binding: HotkeyBinding, siteHotkeysEnabled: boolean): boolean {
	return siteHotkeysEnabled;
}

// Какое действие вызывает нажатие. undefined — никакое: клавиши сайта выключены, поле ввода, Ctrl/Alt/Meta,
// автоповтор или клавиши нет в списке
export function matchHotkey(
	event: KeyEventLike,
	bindings: readonly HotkeyBinding[],
	siteHotkeysEnabled = true
): string | undefined {
	if (event.ctrlKey || event.altKey || event.metaKey || event.repeat) return undefined;
	if (isTypingTarget(event.target)) return undefined;
	return bindings.find(
		(binding) =>
			isHotkeyActive(binding, siteHotkeysEnabled) &&
			binding.code === event.code &&
			Boolean(binding.shift) === event.shiftKey
	)?.action;
}

// Совпадающие сочетания: возвращает повторы, чтобы тест мог их показать
export function duplicateBindings(bindings: readonly HotkeyBinding[]): string[] {
	const seen = new Set<string>();
	const duplicates: string[] = [];
	for (const binding of bindings) {
		const id = `${binding.shift ? 'Shift+' : ''}${binding.code}`;
		if (seen.has(id)) duplicates.push(id);
		seen.add(id);
	}
	return duplicates;
}
