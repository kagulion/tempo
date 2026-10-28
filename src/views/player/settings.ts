import { isRecord } from '@/lib/storage';

import type { Rpm } from './spin';

// Настройки самого проигрывателя (без коллекции). Чистый модуль без React

export type RepeatMode = 'off' | 'one' | 'all';

export const repeatLabels: Record<RepeatMode, string> = {
	off: 'Без повтора',
	one: 'Повтор одной',
	all: 'Повтор всех'
};

// Скорость воспроизведения из меню
export const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

// Виджеты поверх пластинки. Список, чтобы добавлять новые: id хранится в настройках
export const overlayList = [{ id: 'clock', label: 'Часы' }] as const;
export type OverlayId = (typeof overlayList)[number]['id'];

export type PlayerSettings = {
	// 0..100
	volume: number;
	muted: boolean;
	rpm: Rpm;
	rate: number;
	repeat: RepeatMode;
	// Включённые виджеты поверх пластинки
	overlays: OverlayId[];
	// Какая пластинка на столе
	discId?: string;
	// Показывать ли плеер YouTube окошком в углу пластинки
	showVideo: boolean;
};

export const defaultSettings: PlayerSettings = {
	volume: 70,
	muted: false,
	rpm: 33,
	rate: 1,
	repeat: 'off',
	overlays: [],
	showVideo: false
};

function isOverlayId(value: unknown): value is OverlayId {
	return overlayList.some((overlay) => overlay.id === value);
}

// Каждое поле проверяем отдельно: одно испорченное не должно сбрасывать остальные
export function parseSettings(saved: unknown): PlayerSettings | undefined {
	if (!isRecord(saved)) return undefined;
	const { volume, muted, rpm, rate, repeat, overlays, discId, showVideo } = saved;

	const result: PlayerSettings = { ...defaultSettings, overlays: [] };
	if (typeof volume === 'number' && Number.isFinite(volume)) {
		result.volume = Math.round(Math.min(100, Math.max(0, volume)));
	}
	if (typeof muted === 'boolean') result.muted = muted;
	if (rpm === 33 || rpm === 45) result.rpm = rpm;
	if (typeof rate === 'number' && (playbackRates as readonly number[]).includes(rate)) {
		result.rate = rate;
	}
	if (repeat === 'off' || repeat === 'one' || repeat === 'all') result.repeat = repeat;
	if (Array.isArray(overlays)) {
		result.overlays = [...new Set(overlays.filter(isOverlayId))];
	}
	if (typeof discId === 'string' && discId !== '') result.discId = discId;
	if (typeof showVideo === 'boolean') result.showVideo = showVideo;
	return result;
}

export function toggleOverlay(list: OverlayId[], id: OverlayId): OverlayId[] {
	return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

// Что делать, когда пластинка доиграла: повторить её, перейти к следующей или остановиться.
// На последней при «Без повтора» — остановка
export function afterEnd(repeat: RepeatMode, isLast: boolean): 'replay' | 'next' | 'stop' {
	if (repeat === 'one') return 'replay';
	if (repeat === 'all') return 'next';
	return isLast ? 'stop' : 'next';
}
