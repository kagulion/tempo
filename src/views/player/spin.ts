// Вращение пластинки. Чистый модуль без React: числа для Web Animations API

import type { DiscStyle } from './collection';

// Сколько секунд занимает один оборот при обычной скорости видео. Сейчас у обоих видов одинаково (медленно, 8⅓ об/мин),
// но запись по виду оставлена: скорость легко развести снова.
// Record по типу вида: новый вид без записи в таблице не соберётся
export const styleRevolutionSeconds: Record<DiscStyle, number> = {
	cd: 7.2,
	vinyl: 7.2
};

// Проигрыватель набирает ход примерно за 0,8 с и останавливается примерно за 1,2 с
export const spinUpMs = 800;
export const spinDownMs = 1200;

// Сколько секунд занимает один оборот. Скорость видео ускоряет пластинку так же
export function secondsPerRevolution(style: DiscStyle, rate: number) {
	return styleRevolutionSeconds[style] / rate;
}

// Обороты в секунду, к которым стремится пластинка. Не играет — стоит
export function targetSpeed(style: DiscStyle, rate: number, playing: boolean) {
	return playing ? 1 / secondsPerRevolution(style, rate) : 0;
}

// Сколько мс нужно на переход от одной скорости к другой: разгон и торможение занимают разное время
export function rampDuration(from: number, to: number) {
	if (from === to) return 0;
	return to > from ? spinUpMs : spinDownMs;
}

// Переход короче, если скорость меняется не от нуля и не до нуля (например, при смене скорости видео
// на ходу): время пропорционально доле полного хода, но не меньше 15 % от обычного
export function scaledRampDuration(from: number, to: number, fullSpeed: number) {
	const base = rampDuration(from, to);
	if (base === 0 || fullSpeed <= 0) return base;
	const share = Math.min(1, Math.abs(to - from) / fullSpeed);
	return Math.round(base * Math.max(share, 0.15));
}

// Скорость через elapsed мс после начала перехода. Замедляющая кривая: пластинка быстро набирает почти
// весь ход и плавно выходит на него, а при остановке сначала сбавляет заметно и докручивается по инерции
export function rampSpeed(from: number, to: number, elapsedMs: number, durationMs: number) {
	if (durationMs <= 0 || elapsedMs >= durationMs) return to;
	if (elapsedMs <= 0) return from;
	const t = elapsedMs / durationMs;
	const eased = 1 - (1 - t) ** 3;
	return from + (to - from) * eased;
}
