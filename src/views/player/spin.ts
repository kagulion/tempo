// Вращение пластинки. Чистый модуль без React: числа для Web Animations API

// Обороты в минуту: 33 означает 33⅓
export type Rpm = 33 | 45;
export const rpmValues: readonly Rpm[] = [33, 45];

export const rpmLabels: Record<Rpm, string> = {
	33: '33⅓',
	45: '45'
};

// Проигрыватель набирает ход примерно за 0,8 с и останавливается примерно за 1,2 с
export const spinUpMs = 800;
export const spinDownMs = 1200;

// Настоящее число оборотов в минуту
export function rpmNumber(rpm: Rpm) {
	return rpm === 33 ? 100 / 3 : rpm;
}

// Сколько секунд занимает один оборот. Скорость видео ускоряет пластинку так же
export function secondsPerRevolution(rpm: Rpm, rate: number) {
	return 60 / (rpmNumber(rpm) * rate);
}

// Обороты в секунду, к которым стремится пластинка. Не играет — стоит
export function targetSpeed(rpm: Rpm, rate: number, playing: boolean) {
	return playing ? 1 / secondsPerRevolution(rpm, rate) : 0;
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
