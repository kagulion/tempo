// Сохранение настроек в localStorage. В приватном режиме хранилище может быть недоступно:
// тогда чтение отдаёт значение по умолчанию, а запись молча ничего не делает

// Все ключи сайта в одном месте, чтобы два виджета случайно не взяли один и тот же
export const storageKeys = {
	ambience: 'tempo:ambience',
	bigClock: 'tempo:big-clock',
	bigClockPosition: 'tempo:big-clock-position',
	clickSounds: 'tempo:click-sounds',
	dimmer: 'tempo:dimmer',
	effects: 'tempo:effects',
	// Кнопка «Без эффектов» в правом верхнем углу: true — эффекты и затемнение скрыты
	effectsOff: 'tempo:effects-off',
	favoriteStations: 'tempo:favorite-stations',
	// Живые обои: true — видео играет, false — на паузе; нет значения — решает «уменьшить движение», см. src/widgets/wallpaper/liveWallpaper.ts
	liveWallpaper: 'tempo:live-wallpaper',
	lastStation: 'tempo:last-station',
	mood: 'tempo:mood',
	// Первый экран со сценами: 'pending' — ещё не выбрали, 'done' — закрыт навсегда
	onboarding: 'tempo:onboarding',
	openWidgets: 'tempo:open-widgets',
	radioCompact: 'tempo:radio-compact',
	radioSort: 'tempo:radio-sort',
	radioSource: 'tempo:radio-source',
	// Звук Rutube-фона (true — включён), см. src/widgets/rutube/useRutube.ts
	rutubeSound: 'tempo:rutube-sound',
	// Кнопка «Без звука» в правом верхнем углу: true — весь звук сайта заглушён
	soundMuted: 'tempo:sound-muted',
	stats: 'tempo:stats',
	tasks: 'tempo:tasks',
	timerRuns: 'tempo:timer-runs',
	timerSettings: 'tempo:timer-settings',
	// Последний канал окна Twitch: login или null, см. src/widgets/twitch/useTwitch.ts
	twitchChannel: 'tempo:twitch-channel',
	// Звук окна Twitch (true — включён)
	twitchSound: 'tempo:twitch-sound',
	// Строка без JSON, см. src/widgets/stats/useOnline.ts
	visitorId: 'tempo:visitor-id',
	wallpaper: 'tempo:wallpaper',
	youtubeHistory: 'tempo:youtube-history',
	// Потолок качества YouTube-фона: 'auto', '1080', '720' или '480', см. src/widgets/youtube/quality.ts
	youtubeQuality: 'tempo:youtube-quality',
	youtubeSound: 'tempo:youtube-sound'
} as const;

export type StorageKey = (typeof storageKeys)[keyof typeof storageKeys];

// Проверяет сохранённое значение и переводит старые форматы в новый.
// undefined — данные не годятся (испорчены или от старой версии), берём значение по умолчанию
export type Parse<T> = (saved: unknown) => T | undefined;

// Обычный объект из JSON, не массив и не null
export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function loadStored<T>(key: StorageKey, fallback: T, parse: Parse<T>): T {
	try {
		const saved = localStorage.getItem(key);
		if (saved === null) return fallback;
		return parse(JSON.parse(saved)) ?? fallback;
	} catch {
		return fallback;
	}
}

export function saveStored(key: StorageKey, value: unknown) {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// Хранилище недоступно — значение живёт до перезагрузки
	}
}

export type PersistentStore<T> = {
	get: () => T;
	set: (next: T | ((current: T) => T)) => void;
	subscribe: (listener: () => void) => () => void;
};

// Сохраняемое состояние вне React, общее для нескольких компонентов: например, выбранные обои
// нужны и фону, и галерее. Читать через useSyncExternalStore(store.subscribe, store.get).
// Если состояние нужно одному хуку, проще usePersistentState из src/hooks/
export function createPersistentStore<T>(
	key: StorageKey,
	fallback: T,
	parse: Parse<T>
): PersistentStore<T> {
	// Читаем при первом обращении, а не при импорте модуля
	let loaded = false;
	let value = fallback;
	const listeners = new Set<() => void>();

	function get() {
		if (!loaded) {
			value = loadStored(key, fallback, parse);
			loaded = true;
		}
		return value;
	}

	return {
		get,
		set(next) {
			value = typeof next === 'function' ? (next as (current: T) => T)(get()) : next;
			loaded = true;
			saveStored(key, value);
			listeners.forEach((listener) => listener());
		},
		subscribe(listener) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		}
	};
}
