// Тихие «тики» при нажатии кнопок: синтезируются через Web Audio, без файлов.
// Один слушатель на весь документ, поэтому отдельным кнопкам ничего подключать не нужно
import { useSyncExternalStore } from 'react';

import { getAudioContext } from './audio';
import { isSoundMuted } from './soundMute';
import { createPersistentStore, storageKeys } from './storage';

function parseEnabled(saved: unknown): boolean | undefined {
	return typeof saved === 'boolean' ? saved : undefined;
}

// Включены ли звуки нажатий (по умолчанию да), сохраняется в localStorage
export const clickSoundsStore = createPersistentStore(storageKeys.clickSounds, true, parseEnabled);

export function useClickSounds() {
	const enabled = useSyncExternalStore(clickSoundsStore.subscribe, clickSoundsStore.get);
	return {
		enabled,
		setEnabled: clickSoundsStore.set,
		toggle: () => clickSoundsStore.set(!enabled)
	};
}

export type ClickKind = 'tap' | 'on' | 'off';

// Высота тика: включение чуть выше, выключение ниже
const frequencies: Record<ClickKind, number> = { tap: 1000, on: 1300, off: 760 };
// Очень тихо: тик не должен перебивать радио и звуки
const peakGain = 0.035;

export function playClick(kind: ClickKind = 'tap') {
	// Режим «без звука»: тики тоже молчат, а их собственная настройка не меняется
	if (isSoundMuted()) return;
	const context = getAudioContext();
	if (!context) return;
	// Внутри обработчика нажатия браузер разрешает запустить звук
	if (context.state === 'suspended') context.resume().catch(() => {});

	const start = context.currentTime;
	const oscillator = context.createOscillator();
	const gain = context.createGain();
	oscillator.type = 'sine';
	oscillator.frequency.setValueAtTime(frequencies[kind] * 1.25, start);
	oscillator.frequency.exponentialRampToValueAtTime(frequencies[kind], start + 0.03);
	// Короткая огибающая: плавный вход (3 мс) и затухание, иначе слышен щелчок
	gain.gain.setValueAtTime(0.0001, start);
	gain.gain.linearRampToValueAtTime(peakGain, start + 0.004);
	gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.07);
	oscillator.connect(gain).connect(context.destination);
	oscillator.start(start);
	oscillator.stop(start + 0.08);
}

const clickableSelector =
	'button, [role="button"], [role="switch"], [role="tab"], [role="menuitem"], [role="checkbox"], [role="option"]';

// Какой тик у нажатого элемента. null — звука нет (не кнопка, выключена, ползунок и т. п.)
export function clickKindOf(target: EventTarget | null): ClickKind | null {
	if (!(target instanceof Element)) return null;
	const element = target.closest(clickableSelector);
	if (!element || element.matches(':disabled, [aria-disabled="true"]')) return null;
	// Состояние до нажатия: была нажата — сейчас выключится
	const state = element.getAttribute('aria-pressed') ?? element.getAttribute('aria-checked');
	if (state === 'true') return 'off';
	if (state === 'false') return 'on';
	return 'tap';
}

// Подключает слушатели к документу, возвращает отключение. Мышь и касание — по pointerdown (без задержки),
// клавиатура (Enter, Пробел) — по click без указателя (detail === 0)
export function installClickSounds() {
	function onPointerDown(event: PointerEvent) {
		if (event.button !== 0 || !clickSoundsStore.get()) return;
		const kind = clickKindOf(event.target);
		if (kind) playClick(kind);
	}
	function onClick(event: MouseEvent) {
		if (event.detail !== 0 || !clickSoundsStore.get()) return;
		const kind = clickKindOf(event.target);
		if (kind) playClick(kind);
	}
	document.addEventListener('pointerdown', onPointerDown, true);
	document.addEventListener('click', onClick, true);
	return () => {
		document.removeEventListener('pointerdown', onPointerDown, true);
		document.removeEventListener('click', onClick, true);
	};
}
