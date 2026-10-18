// Ссылки на Rutube, id обоев, темы эфиров и сообщения плеера. Чистый модуль без React: его легко тестировать

const idPattern = /^[0-9a-f]{32}$/;
const wallpaperIdPattern = /^rutube\/([0-9a-f]{32})$/;

// Хосты Rutube; «www.» отбрасываем до сравнения
const rutubeHosts = new Set(['rutube.ru']);

// Пути вида /video/<id>, /live/video/<id>, /play/embed/<id>
const videoPaths = [['video'], ['live', 'video'], ['play', 'embed']];

// Достаёт id эфира или видео из ссылки rutube.ru/video/<id>/, /live/video/<id>/ или /play/embed/<id>.
// Всё, что не похоже на ссылку Rutube, — undefined
export function parseRutubeUrl(input: string): string | undefined {
	const text = input.trim();
	// Без протокола URL не разберёт ссылку: «rutube.ru/…» — это относительный путь
	const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text}`;
	let url: URL;
	try {
		url = new URL(withProtocol);
	} catch {
		return undefined;
	}
	if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined;
	if (!rutubeHosts.has(url.hostname.replace(/^www\./, ''))) return undefined;

	const segments = url.pathname.split('/').filter(Boolean);
	for (const prefix of videoPaths) {
		if (segments.length !== prefix.length + 1) continue;
		if (!prefix.every((part, index) => segments[index] === part)) continue;
		const id = segments[prefix.length].toLowerCase();
		return idPattern.test(id) ? id : undefined;
	}
	return undefined;
}

// id обоев в localStorage и в списке обоев: rutube/<id эфира>
export function rutubeWallpaperId(streamId: string) {
	return `rutube/${streamId}`;
}

export function parseRutubeWallpaperId(id: unknown): string | undefined {
	return typeof id === 'string' ? wallpaperIdPattern.exec(id)?.[1] : undefined;
}

// Адрес плеера для iframe. Управляем им через postMessage
export function rutubeEmbedUrl(streamId: string) {
	// autoplay и autostartmute: без них плеер ждёт клика, а в фон кликнуть нельзя
	return `https://rutube.ru/play/embed/${streamId}?autoplay=true&autostartmute=true`;
}

// Эфир, который не начал играть за это время, считаем недоступным. Время с запасом: перед эфиром
// плеер Rutube показывает рекламу (до двух минут на медленной сети), и сообщение «играет» приходит только после неё
export const rutubeStartTimeoutMs = 180_000;

// Темы ТВ-эфиров Rutube. id — тема в API Rutube, по нему скрипт scripts/rutube-snapshot.ts собирает снимок
export const rutubeTopics = [
	{ id: 2, label: 'Развлекательные' },
	{ id: 5, label: 'Кино и сериалы' },
	{ id: 15, label: 'Мультфильмы' },
	{ id: 8, label: 'Музыка' },
	{ id: 10, label: 'Познавательные' }
] as const;

export type RutubeTopicId = (typeof rutubeTopics)[number]['id'];

export const rutubeErrors = {
	badLink: 'Не похоже на ссылку на видео или эфир Rutube',
	unavailable: 'Эфир недоступен',
	timeout: 'Эфир не отвечает'
} as const;

export const rutubeHints = {
	launch: 'Нажмите на плеер, чтобы запустить эфир',
	cancel: 'Отмена',
	waiting: 'Эфир ждёт запуска: нажмите ▶ в шапке окна'
} as const;

// Сообщение плеера Rutube: JSON-строка {type, data}. Чужое и испорченное — undefined
export type PlayerMessage = { type: string; data: Record<string, unknown> };

export function parsePlayerMessage(raw: unknown): PlayerMessage | undefined {
	let value: unknown = raw;
	if (typeof raw === 'string') {
		try {
			value = JSON.parse(raw);
		} catch {
			return undefined;
		}
	}
	if (typeof value !== 'object' || value === null) return undefined;
	const { type, data } = value as Record<string, unknown>;
	if (typeof type !== 'string' || !type.startsWith('player:')) return undefined;
	return {
		type,
		data: typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {}
	};
}

// Начался ли эфир. Плеер перед эфиром показывает рекламу и сообщает о ней по-разному, а `changeState: playing`
// иногда не приходит, поэтому эфиром считаем любой из сигналов: playing, playStart или время, которое растёт
// два сообщения подряд, пока реклама не идёт
export type StartTracker = {
	started: boolean;
	// Сейчас идёт реклама
	advert: boolean;
	// Последнее время, которое сообщил плеер вне рекламы
	lastTime?: number;
	// Сколько раз подряд оно выросло
	growths: number;
};

export const initialStartTracker: StartTracker = { started: false, advert: false, growths: 0 };

export function trackStart(tracker: StartTracker, message: PlayerMessage): StartTracker {
	if (tracker.started) return tracker;
	const { type, data } = message;

	if (type === 'player:adStart')
		return { ...tracker, advert: true, lastTime: undefined, growths: 0 };
	if (type === 'player:adEnd')
		return { ...tracker, advert: false, lastTime: undefined, growths: 0 };
	if (type === 'player:rollState') {
		if (data.state === 'play') return { ...tracker, advert: true, lastTime: undefined, growths: 0 };
		if (data.state === 'complete')
			return { ...tracker, advert: false, lastTime: undefined, growths: 0 };
		return tracker;
	}
	if (type === 'player:changeState') {
		if (data.state === 'advert') {
			const advert = data.phase !== 'complete';
			return { ...tracker, advert, lastTime: undefined, growths: 0 };
		}
		if (data.state === 'playing') return { ...tracker, started: true };
		return tracker;
	}
	if (type === 'player:playStart') return tracker.advert ? tracker : { ...tracker, started: true };
	if (type === 'player:currentTime') {
		if (tracker.advert) return tracker;
		const time = typeof data.time === 'number' ? data.time : data.currentTime;
		if (typeof time !== 'number') return tracker;
		if (tracker.lastTime === undefined || time <= tracker.lastTime) {
			return { ...tracker, lastTime: time, growths: 0 };
		}
		const growths = tracker.growths + 1;
		return { ...tracker, lastTime: time, growths, started: growths >= 2 };
	}
	return tracker;
}

// Встроенному плееру Rutube нужен клик пользователя внутри iframe: без него он доходит до `player:ready` и молчит.
// Если за это время после ready от плеера не пришло ни одного сигнала о воспроизведении, ждём клика
export const rutubeClickWaitMs = 3000;

// Сообщение говорит о том, что плеер что-то делает: играет, показывает рекламу или сообщает время
export function isPlaybackSignal(type: string) {
	return /^player:(changeState|rollState|playStart|currentTime|ad\w+)$/.test(type);
}

type AwaitClickInput = {
	// Плеер прислал ready
	ready: boolean;
	// Эфир уже начался
	started: boolean;
	// После ready пришёл хоть один сигнал воспроизведения
	signalSeen: boolean;
	// Ожидание клика уже было: повторно в него не переходим, только при первом старте
	awaitedBefore: boolean;
};

// Пора ли показать «нажмите на фон». Вызывается, когда истекло rutubeClickWaitMs после ready
export function shouldAwaitClick({ ready, started, signalSeen, awaitedBefore }: AwaitClickInput) {
	return ready && !started && !signalSeen && !awaitedBefore;
}

// Команда плееру в виде строки для postMessage
export function playerCommand(type: string, data: Record<string, unknown> = {}) {
	return JSON.stringify({ type, data });
}

// Эфир из ответа прокси
export type RutubeStream = {
	id: string;
	title: string;
	author: string;
	thumbnail: string;
	hits: number;
};

// Ответ прокси {streams: [...]} → список эфиров. Плохие элементы отбрасываем
export function parseStreams(response: unknown): RutubeStream[] {
	if (typeof response !== 'object' || response === null) return [];
	const streams = (response as Record<string, unknown>).streams;
	if (!Array.isArray(streams)) return [];

	const result: RutubeStream[] = [];
	for (const item of streams) {
		if (typeof item !== 'object' || item === null) continue;
		const { id, title, author, thumbnail, hits } = item as Record<string, unknown>;
		if (typeof id !== 'string' || !idPattern.test(id)) continue;
		if (typeof title !== 'string' || title.trim() === '') continue;
		result.push({
			id,
			title,
			author: typeof author === 'string' ? author : '',
			// Превью грузим только по https
			thumbnail: typeof thumbnail === 'string' && thumbnail.startsWith('https://') ? thumbnail : '',
			hits: typeof hits === 'number' ? hits : 0
		});
	}
	return result;
}
