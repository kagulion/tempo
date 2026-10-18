// Решения о паузе и звуке YouTube-фона. Чистый модуль без React: его легко тестировать

type PauseInput = {
	// Выбор посетителя кнопкой: true — пауза, false — играть. undefined — ещё не выбирал
	paused: boolean | undefined;
	// Вкладка скрыта: видео в фоне зря грузит процессор
	hidden: boolean;
	// В системе включено «уменьшить движение»: видео стоит на первом кадре
	reducedMotion: boolean;
};

// Стоит ли видео по мнению посетителя. При «уменьшить движение» по умолчанию стоит,
// но кнопкой его можно запустить: видео посетитель выбрал сам
export function isStopped(paused: boolean | undefined, reducedMotion: boolean) {
	return paused ?? reducedMotion;
}

export function shouldPause({ paused, hidden, reducedMotion }: PauseInput) {
	return hidden || isStopped(paused, reducedMotion);
}

type AudioInput = {
	// Посетитель включил звук
	soundOn: boolean;
	// Браузер уже разрешает звук: на странице было действие пользователя
	unlocked: boolean;
	// Слой сейчас главный: он выбран и уже проявился. У уходящего и входящего слоя звука нет
	active: boolean;
	// Множитель громкости от таймера, 0..1 (см. src/lib/ducking.ts)
	duck: number;
};

export type AudioTarget = { muted: true } | { muted: false; volume: number };

// Громкость плеера YouTube — целое от 0 до 100
export function playerVolume(duck: number) {
	return Math.round(100 * Math.min(1, Math.max(0, duck)));
}

export function audioTarget({ soundOn, unlocked, active, duck }: AudioInput): AudioTarget {
	// Нулевой множитель — тишина под сигналом таймера или режим «без звука»: глушим, а не ставим громкость 0,
	// потому что на iPhone громкость видео не меняется, работает только mute
	if (!soundOn || !unlocked || !active || duck <= 0) return { muted: true };
	return { muted: false, volume: playerVolume(duck) };
}

// Звук включён ли — сохранённое значение. Не boolean — данные не годятся
export function parseSoundOn(saved: unknown) {
	return typeof saved === 'boolean' ? saved : undefined;
}
