// Время и место воспроизведения. Чистый модуль без React

// Как часто (мс) сохраняем место, пока пластинка играет
export const positionSaveMs = 5000;

// 3723 → «1:02:03», 75 → «1:15». Неизвестное или отрицательное время — «0:00»
export function formatTime(seconds: number) {
	const total = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
	const hours = Math.floor(total / 3600);
	const minutes = Math.floor((total % 3600) / 60);
	const rest = String(total % 60).padStart(2, '0');
	return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${rest}` : `${minutes}:${rest}`;
}

// Куда перемотать при сдвиге на delta секунд: не раньше начала и не позже конца (длительность 0 — неизвестна)
export function seekTarget(current: number, delta: number, duration: number) {
	const target = Math.max(0, current + delta);
	return duration > 0 ? Math.min(target, duration) : target;
}

// С какого места продолжать: запомненное, иначе из ссылки. Если до конца почти ничего не осталось,
// пластинка начинается сначала (или со времени из ссылки)
export function resumeFrom(position: number | undefined, start: number | undefined, duration = 0) {
	if (position !== undefined && position > 0) {
		const nearEnd = duration > 0 && duration - position < 5;
		if (!nearEnd) return Math.floor(position);
	}
	return start;
}
