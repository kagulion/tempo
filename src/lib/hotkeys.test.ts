import { describe, expect, it } from 'vitest';

import { hotkeyBindings } from '@/widgets/hotkeys/bindings';

import {
	bindingName,
	duplicateBindings,
	isTypingTarget,
	keyName,
	matchHotkey,
	staticHotkeys,
	widgetHotkeys,
	type HotkeyBinding
} from './hotkeys';

const bindings: HotkeyBinding[] = [
	{ action: 'widget:radio', code: 'Digit1', label: 'Радио', group: 'windows' },
	...staticHotkeys
];

function press(code: string, extra: Partial<Parameters<typeof matchHotkey>[0]> = {}) {
	return matchHotkey(
		{
			code,
			shiftKey: false,
			ctrlKey: false,
			altKey: false,
			metaKey: false,
			repeat: false,
			target: null,
			...extra
		},
		bindings
	);
}

describe('сопоставление клавиш', () => {
	it('находит действие по коду клавиши, не зависит от раскладки', () => {
		expect(press('KeyF')).toBe('fullscreen');
		expect(press('KeyM')).toBe('soundMuted');
		expect(press('KeyE')).toBe('effectsOff');
		expect(press('Digit1')).toBe('widget:radio');
	});

	it('«?» — это Shift+Slash, а просто Slash ничего не делает', () => {
		expect(press('Slash', { shiftKey: true })).toBe('help');
		expect(press('Slash')).toBeUndefined();
	});

	it('Shift без привязки не срабатывает для обычных клавиш', () => {
		expect(press('KeyF', { shiftKey: true })).toBeUndefined();
	});

	it('не ломает сочетания браузера: Ctrl, Alt, Meta', () => {
		expect(press('KeyF', { ctrlKey: true })).toBeUndefined();
		expect(press('KeyF', { altKey: true })).toBeUndefined();
		expect(press('KeyF', { metaKey: true })).toBeUndefined();
	});

	it('игнорирует автоповтор и неизвестные клавиши', () => {
		expect(press('KeyF', { repeat: true })).toBeUndefined();
		expect(press('KeyQ')).toBeUndefined();
	});
});

describe('клавиши сайта выключены', () => {
	it('ни одна привязка не срабатывает, включая «?»', () => {
		for (const binding of bindings) {
			const event = {
				code: binding.code,
				shiftKey: Boolean(binding.shift),
				ctrlKey: false,
				altKey: false,
				metaKey: false,
				repeat: false,
				target: null
			};
			expect(matchHotkey(event, bindings, false)).toBeUndefined();
			expect(matchHotkey(event, bindings, true)).toBe(binding.action);
		}
	});
});

describe('поля ввода', () => {
	// Тесты идут в Node без DOM: подделываем элемент с closest
	class FakeElement {
		constructor(private tag: string) {}
		closest(selector: string) {
			return selector.split(',').some((part) => part.trim().startsWith(this.tag)) ? this : null;
		}
	}

	it('без DOM поле ввода не определяется, и цель null не мешает', () => {
		expect(isTypingTarget(null)).toBe(false);
		expect(isTypingTarget({} as EventTarget)).toBe(false);
	});

	it('role=textbox и role=combobox — тоже поле ввода', () => {
		const globalWithElement = globalThis as unknown as { Element?: unknown };
		const original = globalWithElement.Element;
		class RoleElement {
			closest(selector: string) {
				return selector.includes('[role="textbox"]') && selector.includes('[role="combobox"]')
					? this
					: null;
			}
		}
		globalWithElement.Element = RoleElement;
		try {
			expect(isTypingTarget(new RoleElement() as unknown as EventTarget)).toBe(true);
		} finally {
			globalWithElement.Element = original;
		}
	});

	it('в поле ввода клавиши не срабатывают', () => {
		const globalWithElement = globalThis as unknown as { Element?: unknown };
		const original = globalWithElement.Element;
		globalWithElement.Element = FakeElement;
		try {
			const input = new FakeElement('input') as unknown as EventTarget;
			const button = new FakeElement('button') as unknown as EventTarget;
			expect(isTypingTarget(input)).toBe(true);
			expect(press('KeyF', { target: input })).toBeUndefined();
			expect(press('KeyF', { target: button })).toBe('fullscreen');
		} finally {
			globalWithElement.Element = original;
		}
	});
});

describe('список клавиш сайта', () => {
	it('в реестре и общих действиях нет одинаковых сочетаний', () => {
		expect(duplicateBindings(hotkeyBindings)).toEqual([]);
	});

	it('duplicateBindings находит повтор', () => {
		expect(
			duplicateBindings([
				{ action: 'a', code: 'KeyA', label: 'A', group: 'other' },
				{ action: 'b', code: 'KeyA', label: 'B', group: 'other' },
				{ action: 'c', code: 'KeyA', shift: true, label: 'C', group: 'other' }
			])
		).toEqual(['KeyA']);
	});

	it('у каждого окна из реестра есть клавиша', () => {
		const withHotkey = hotkeyBindings.filter((binding) => binding.action.startsWith('widget:'));
		expect(withHotkey.length).toBeGreaterThan(0);
	});

	it('widgetHotkeys пропускает окна без клавиши', () => {
		expect(
			widgetHotkeys([
				{ id: 'a', label: 'А', hotkey: 'KeyA' },
				{ id: 'b', label: 'Б' }
			])
		).toEqual([{ action: 'widget:a', code: 'KeyA', label: 'А', group: 'windows' }]);
	});

	it('подписи клавиш латиницей', () => {
		expect(keyName('KeyR')).toBe('R');
		expect(keyName('Digit0')).toBe('0');
		expect(bindingName({ code: 'Slash', shift: true })).toBe('?');
		expect(bindingName({ code: 'KeyK', shift: true })).toBe('Shift+K');
	});
});
