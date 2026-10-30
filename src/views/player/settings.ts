import { isRecord } from '@/lib/storage';

import { defaultStyle, discStyles, type DiscStyle } from './collection';

// Настройки самого проигрывателя (без коллекции). Чистый модуль без React

export type RepeatMode = 'off' | 'one' | 'all';

export const repeatLabels: Record<RepeatMode, string> = {
	off: 'Без повтора',
	one: 'Повтор одной',
	all: 'Повтор всех'
};

// Скорость воспроизведения из меню
export const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

export type PlayerSettings = {
	// 0..100
	volume: number;
	muted: boolean;
	rate: number;
	repeat: RepeatMode;
	// Какая пластинка на столе
	discId?: string;
	// Показывать ли плеер YouTube окошком в углу пластинки
	showVideo: boolean;
	// Открыто ли окно коллекции
	collectionOpen: boolean;
	// Вид пластинок: один на всю коллекцию и большую пластинку
	style: DiscStyle;
};

export const defaultSettings: PlayerSettings = {
	volume: 70,
	muted: false,
	rate: 1,
	repeat: 'off',
	showVideo: false,
	// При первом заходе коллекция пуста, и поле для ссылки нужно сразу
	collectionOpen: true,
	style: defaultStyle
};

// Старые поля не читаем: rpm (обороты; скорость зависит от вида пластинки) и overlays (виджеты поверх пластинки убраны).
// Каждое поле проверяем отдельно: одно испорченное не должно сбрасывать остальные
export function parseSettings(saved: unknown): PlayerSettings | undefined {
	if (!isRecord(saved)) return undefined;
	const { volume, muted, rate, repeat, discId, showVideo, collectionOpen, style } = saved;

	const result: PlayerSettings = { ...defaultSettings };
	if (typeof volume === 'number' && Number.isFinite(volume)) {
		result.volume = Math.round(Math.min(100, Math.max(0, volume)));
	}
	if (typeof muted === 'boolean') result.muted = muted;
	if (typeof rate === 'number' && (playbackRates as readonly number[]).includes(rate)) {
		result.rate = rate;
	}
	if (repeat === 'off' || repeat === 'one' || repeat === 'all') result.repeat = repeat;
	if (typeof discId === 'string' && discId !== '') result.discId = discId;
	if (typeof showVideo === 'boolean') result.showVideo = showVideo;
	if (typeof collectionOpen === 'boolean') result.collectionOpen = collectionOpen;
	if (typeof style === 'string' && (discStyles as readonly string[]).includes(style)) {
		result.style = style as DiscStyle;
	}
	return result;
}

// Что делать, когда пластинка доиграла: повторить её, перейти к следующей или остановиться.
// На последней при «Без повтора» — остановка
export function afterEnd(repeat: RepeatMode, isLast: boolean): 'replay' | 'next' | 'stop' {
	if (repeat === 'one') return 'replay';
	if (repeat === 'all') return 'next';
	return isLast ? 'stop' : 'next';
}
