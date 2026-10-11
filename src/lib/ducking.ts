// Приглушение музыки вокруг сигнала таймера. Таймер сообщает, когда будет сигнал,
// а звуковые виджеты умножают свою громкость на duckLevel()

// Сколько мс музыка затихает перед сигналом и столько же возвращается после него
export const duckFade = 5000;

// Момент сигнала: к нему музыка плавно затихает до нуля. null — сигнала не ждём
let fadeOutAt: number | null = null;
// С этого момента музыка плавно возвращается. До него — тишина
let fadeInAt: number | null = null;

const listeners = new Set<() => void>();

function emit() {
	listeners.forEach((listener) => listener());
}

function clamp(value: number) {
	return Math.min(1, Math.max(0, value));
}

export function duckBefore(at: number | null) {
	if (fadeOutAt === at) return;
	fadeOutAt = at;
	emit();
}

export function restoreAfter(delay: number) {
	fadeInAt = Date.now() + delay;
	emit();
}

// Множитель громкости от 0 до 1 на момент now
export function duckLevel(now: number) {
	const out = fadeOutAt === null ? 1 : clamp((fadeOutAt - now) / duckFade);
	const back = fadeInAt === null ? 1 : clamp((now - fadeInAt) / duckFade);
	return Math.min(out, back);
}

// Нужно ли сейчас следить за временем: впереди затухание или идёт возврат
export function isDucking(now: number) {
	return fadeOutAt !== null || (fadeInAt !== null && now < fadeInAt + duckFade);
}

export function subscribeDucking(listener: () => void) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}
