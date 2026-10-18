// Ссылки на Twitch, сохранённый канал, темы каналов, тексты и логика запуска эфира. Чистый модуль без React: его легко тестировать

// Правила Twitch для login: 4–25 символов, латиница, цифры и «_». Регистр не важен, храним нижний
const loginPattern = /^[a-z0-9_]{4,25}$/;

// Хосты сайта Twitch; «www.» и «m.» отбрасываем до сравнения
const twitchHosts = new Set(['twitch.tv']);

// Первые сегменты путей twitch.tv, которые не каналы (но подходят под правила login)
const reservedPaths = new Set([
	'directory',
	'videos',
	'downloads',
	'turbo',
	'settings',
	'store',
	'search',
	'friends',
	'drops',
	'wallet',
	'subscriptions',
	'inventory',
	'jobs',
	'popout',
	'embed'
]);

// Login из строки без пробелов: правильный — в нижнем регистре, иначе undefined
export function normalizeLogin(input: string): string | undefined {
	const login = input.trim().toLowerCase();
	return loginPattern.test(login) ? login : undefined;
}

// Достаёт login канала из ссылки twitch.tv/<login> (с www., m., без протокола) или player.twitch.tv/?channel=<login>.
// Всё, что не похоже на ссылку на канал, — undefined
export function parseTwitchUrl(input: string): string | undefined {
	const text = input.trim();
	// Без протокола URL не разберёт ссылку: «twitch.tv/…» — это относительный путь
	const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text}`;
	let url: URL;
	try {
		url = new URL(withProtocol);
	} catch {
		return undefined;
	}
	if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined;

	const host = url.hostname.toLowerCase();
	if (host === 'player.twitch.tv') {
		const channel = url.searchParams.get('channel');
		return channel === null ? undefined : normalizeLogin(channel);
	}
	if (!twitchHosts.has(host.replace(/^(www|m)\./, ''))) return undefined;

	const segments = url.pathname.split('/').filter(Boolean);
	if (segments.length !== 1) return undefined;
	const login = segments[0].toLowerCase();
	return reservedPaths.has(login) ? undefined : normalizeLogin(login);
}

// Сохранённый последний канал: login или null, если канал ещё не выбирали. Чужое и испорченное — undefined
export function parseSavedChannel(saved: unknown): string | null | undefined {
	if (saved === null) return null;
	return typeof saved === 'string' ? normalizeLogin(saved) : undefined;
}

// Превью канала без ключа API. Для канала не в эфире Twitch отдаёт заглушку 404_preview
export function twitchThumbUrl(login: string) {
	return `https://static-cdn.jtvnw.net/previews-ttv/live_user_${login}-640x360.jpg`;
}

// Темы каналов. Пока одна: добавить тему — вписать её сюда и в channels.ts
export const twitchTopics = [{ id: 'music', label: 'Музыка' }] as const;

export type TwitchTopicId = (typeof twitchTopics)[number]['id'];

export type TwitchChannel = {
	login: string;
	title: string;
	// Жанр или автор, подпись под названием
	author: string;
};

export const twitchErrors = {
	badLink: 'Не похоже на ссылку на канал Twitch',
	noChannel: 'Нет такого канала или эфир недоступен',
	offline: 'Канал не в эфире',
	timeout: 'Эфир не отвечает',
	script: 'Не удалось загрузить плеер Twitch'
} as const;

export const twitchHints = {
	play: 'Запустить эфир'
} as const;

// Несуществующий или снесённый канал не присылает ничего (ни READY, ни ошибки), поэтому ждём READY ограниченное время.
// В пробе READY приходил за 1.7–2 с; 15 с — запас на медленную сеть и холодную загрузку скрипта плеера
export const twitchReadyTimeoutMs = 15_000;

// После ONLINE до PLAYING в пробе проходило 2–8 с. Реклама перед эфиром событий не даёт, а предролл
// Twitch анонимному зрителю длится до ~30 с. Берём 45 с: 30 с рекламы плюс обычный запуск и запас на сеть
export const twitchPlayTimeoutMs = 45_000;

// Как далеко продвинулся запуск эфира
export type StartTracker = {
	// Плеер готов (READY)
	ready: boolean;
	// Канал в эфире (ONLINE)
	online: boolean;
	// Канал не в эфире (OFFLINE)
	offline: boolean;
	// Эфир пошёл (PLAYING): ONLINE и READY для этого недостаточны, картинки и звука ещё может не быть
	started: boolean;
};

export const initialStartTracker: StartTracker = {
	ready: false,
	online: false,
	offline: false,
	started: false
};

// Имена событий плеера (константы Twitch.Player из v1.js)
export type PlayerEventName = 'ready' | 'online' | 'offline' | 'playing' | 'playbackBlocked';

export function trackStart(tracker: StartTracker, event: PlayerEventName): StartTracker {
	// Эфир уже пошёл: паузы, перезапуск потока и прочее после этого запуск не откатывают
	if (tracker.started) return tracker;
	switch (event) {
		case 'ready':
			return { ...tracker, ready: true };
		case 'online':
			return { ...tracker, ready: true, online: true, offline: false };
		case 'offline':
			return { ...tracker, ready: true, offline: true };
		case 'playing':
			return { ...tracker, ready: true, online: true, started: true };
		case 'playbackBlocked':
			return tracker;
	}
}

// Сколько ждать следующего сообщения от плеера и что сказать, если его нет
export function startTimeout(tracker: StartTracker): { ms: number; error: string } {
	return tracker.ready
		? { ms: twitchPlayTimeoutMs, error: twitchErrors.timeout }
		: { ms: twitchReadyTimeoutMs, error: twitchErrors.noChannel };
}

// Тост, когда окно Twitch закрыли и эфир из-за этого встал на паузу. Один id: повторное закрытие не множит тосты
export const twitchPausedToast = {
	id: 'twitch-paused',
	title: 'Эфир Twitch на паузе',
	description: 'Плеер Twitch играет только в открытом окне',
	action: 'Открыть',
	// Тост видно примерно столько, потом он уходит сам
	timeoutMs: 5500
} as const;

type WindowClosedInput = {
	// Эфир в этот момент играл. На паузе, в ошибке, при загрузке или без запуска говорить не о чем
	playing: boolean;
	// Вкладка скрыта: закрыли вкладку или ушли на другую, окно при этом не закрывали
	tabHidden: boolean;
};

// Нужно ли сказать, что эфир встал на паузу из-за закрытия окна
export function shouldNotifyWindowClosed({ playing, tabHidden }: WindowClosedInput) {
	return playing && !tabHidden;
}
