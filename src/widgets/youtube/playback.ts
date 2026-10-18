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

// Сколько после нашей команды pauseVideo/playVideo события плеера считаем откликом на неё, а не чужим действием.
// Команда и событие идут через postMessage, поэтому PLAYING, отправленное до нашей паузы, может прийти после неё
export const playerCommandGraceMs = 1000;

type PlayerStateInput = {
	// Что плеер сообщил: видео пошло или встало на паузу
	state: 'playing' | 'paused';
	// Что мы последним сказали плееру: true — пауза, false — играть, undefined — ещё ничего
	appliedPause: boolean | undefined;
	// Вкладка скрыта: тогда паузу ставим мы сами (а иногда и браузер), это не выбор посетителя
	hidden: boolean;
	// Видео уже хоть раз пошло. До этого PLAYING — запоздалый автозапуск, а не действие посетителя
	started: boolean;
	// Сколько миллисекунд прошло с нашей последней команды плееру
	sinceCommandMs: number;
};

// Видео остановили или запустили в обход кнопки окна: клавишами мультимедиа, из системного плеера.
// Возвращает новое значение паузы для кнопки или undefined, если это отклик на нашу же команду
export function pauseFromPlayer({
	state,
	appliedPause,
	hidden,
	started,
	sinceCommandMs
}: PlayerStateInput): boolean | undefined {
	if (hidden || sinceCommandMs < playerCommandGraceMs) return undefined;
	if (state === 'paused') return appliedPause === false ? true : undefined;
	return appliedPause === true && started ? false : undefined;
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
