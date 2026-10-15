// Живое значение вне React с общим источником: подключение или таймер запускаются при первом подписчике
// и останавливаются, когда отписался последний. Так два компонента с одним хуком не открывают
// два канала и не заводят два таймера. Читать через useSyncExternalStore(store.subscribe, store.get)

export type LiveStore<T> = {
	get: () => T;
	subscribe: (listener: () => void) => () => void;
};

// initial вызывается при первом чтении, а не при импорте модуля.
// start получает функцию записи значения и возвращает остановку источника.
// После остановки значение возвращается к initial, чтобы при новом запуске не показывать устаревшее
export function createLiveStore<T>(
	initial: () => T,
	start: (set: (next: T) => void) => () => void
): LiveStore<T> {
	let ready = false;
	let value: T;
	let stop: (() => void) | null = null;
	const listeners = new Set<() => void>();

	function get() {
		if (!ready) {
			value = initial();
			ready = true;
		}
		return value;
	}

	function set(next: T) {
		if (Object.is(next, get())) return;
		value = next;
		ready = true;
		listeners.forEach((listener) => listener());
	}

	return {
		get,
		subscribe(listener) {
			listeners.add(listener);
			if (listeners.size === 1) stop = start(set);
			return () => {
				if (!listeners.delete(listener) || listeners.size > 0) return;
				stop?.();
				stop = null;
				ready = false;
			};
		}
	};
}
