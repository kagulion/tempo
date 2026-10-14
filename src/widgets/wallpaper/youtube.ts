// Ссылки на YouTube и история последних видео. Чистый модуль без React: его легко тестировать

export type YouTubeVideo = {
	videoId: string;
	// Секунда, с которой начинать и к которой возвращаться при зацикливании
	start?: number;
};

// Элемент истории: видео и название, которое мы узнали у плеера
export type YouTubeHistoryItem = YouTubeVideo & {
	title?: string;
};

// Сколько видео помнит история
export const historyLimit = 8;

const videoIdPattern = /^[A-Za-z0-9_-]{11}$/;
const wallpaperIdPattern = /^youtube\/([A-Za-z0-9_-]{11})$/;

// Хосты, на которых бывают ссылки на видео; «www.» отбрасываем до сравнения
const youtubeHosts = new Set(['youtube.com', 'm.youtube.com', 'music.youtube.com']);
const nocookieHosts = new Set(['youtube-nocookie.com']);
const shortHosts = new Set(['youtu.be']);

// Пути вида /<раздел>/<id>
const videoSections = new Set(['shorts', 'live', 'embed']);

// 90, 90s, 1m30s, 1h2m3s → секунды. Нулевое и непонятное время считаем отсутствующим
export function parseTimestamp(input: string | null | undefined): number | undefined {
	if (!input) return undefined;
	const text = input.trim().toLowerCase();
	if (/^\d+$/.test(text)) return toStart(Number(text));

	const match = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(text);
	if (!match || (match[1] === undefined && match[2] === undefined && match[3] === undefined)) {
		return undefined;
	}
	const [hours, minutes, seconds] = [match[1], match[2], match[3]].map((part) => Number(part ?? 0));
	return toStart(hours * 3600 + minutes * 60 + seconds);
}

function toStart(seconds: number) {
	return Number.isSafeInteger(seconds) && seconds > 0 ? seconds : undefined;
}

function findVideoId(url: URL): string | undefined {
	const host = url.hostname.replace(/^www\./, '');
	const segments = url.pathname.split('/').filter(Boolean);

	if (shortHosts.has(host)) return segments[0];
	if (nocookieHosts.has(host)) return segments[0] === 'embed' ? segments[1] : undefined;
	if (!youtubeHosts.has(host)) return undefined;

	if (segments[0] === 'watch') return url.searchParams.get('v') ?? undefined;
	return videoSections.has(segments[0] ?? '') ? segments[1] : undefined;
}

// Достаёт id видео и время старта из ссылки. Всё, что не похоже на видео YouTube, — undefined
export function parseYouTubeUrl(input: string): YouTubeVideo | undefined {
	const text = input.trim();
	if (videoIdPattern.test(text)) return { videoId: text };

	// Без протокола URL не разберёт ссылку: «youtu.be/…» — это относительный путь
	const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text}`;
	let url: URL;
	try {
		url = new URL(withProtocol);
	} catch {
		return undefined;
	}
	if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined;

	const videoId = findVideoId(url);
	if (videoId === undefined || !videoIdPattern.test(videoId)) return undefined;

	// Время бывает и в параметрах (?t=90), и после решётки (#t=90)
	const hashParams = new URLSearchParams(url.hash.slice(1));
	const start = parseTimestamp(
		url.searchParams.get('t') ??
			url.searchParams.get('start') ??
			hashParams.get('t') ??
			hashParams.get('start')
	);
	return start === undefined ? { videoId } : { videoId, start };
}

// id обоев в localStorage и в списке обоев: youtube/<videoId>
export function youtubeWallpaperId(videoId: string) {
	return `youtube/${videoId}`;
}

export function parseYoutubeWallpaperId(id: unknown): string | undefined {
	return typeof id === 'string' ? wallpaperIdPattern.exec(id)?.[1] : undefined;
}

// Превью видео. Его же показываем под плеером, пока он грузится
export function youtubeThumb(videoId: string) {
	return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

// Что показать, когда плеер сообщил об ошибке (коды из документации YouTube IFrame API)
export function youtubeErrorMessage(code: number) {
	if (code === 101 || code === 150) return 'Это видео нельзя встроить';
	if (code === 2 || code === 100) return 'Видео не найдено';
	return 'Не удалось воспроизвести видео';
}

// Новое видео — в начало списка, прежнее такое же исчезает. Название старой записи не теряем,
// если у новой его нет: при повторной вставке ссылки плеер ещё не успел его сообщить
export function addToHistory(
	list: YouTubeHistoryItem[],
	item: YouTubeHistoryItem,
	max = historyLimit
): YouTubeHistoryItem[] {
	const previous = list.find((entry) => entry.videoId === item.videoId);
	const title = item.title ?? previous?.title;
	const next: YouTubeHistoryItem = { videoId: item.videoId };
	if (title !== undefined) next.title = title;
	if (item.start !== undefined) next.start = item.start;
	return [next, ...list.filter((entry) => entry.videoId !== item.videoId)].slice(0, max);
}

export function removeFromHistory(list: YouTubeHistoryItem[], videoId: string) {
	return list.filter((entry) => entry.videoId !== videoId);
}

// Если название не изменилось или видео нет в истории, возвращает тот же список, чтобы не писать зря
export function setHistoryTitle(list: YouTubeHistoryItem[], videoId: string, title: string) {
	const index = list.findIndex((entry) => entry.videoId === videoId);
	if (index === -1 || list[index].title === title) return list;
	return list.map((entry, i) => (i === index ? { ...entry, title } : entry));
}

// Проверка сохранённой истории: плохие элементы отбрасываем, остальные остаются
export function parseHistory(saved: unknown): YouTubeHistoryItem[] | undefined {
	if (!Array.isArray(saved)) return undefined;

	const result: YouTubeHistoryItem[] = [];
	for (const entry of saved) {
		if (typeof entry !== 'object' || entry === null) continue;
		const { videoId, title, start } = entry as Record<string, unknown>;
		if (typeof videoId !== 'string' || !videoIdPattern.test(videoId)) continue;
		if (result.some((item) => item.videoId === videoId)) continue;

		const item: YouTubeHistoryItem = { videoId };
		if (typeof title === 'string' && title.trim() !== '') item.title = title;
		if (typeof start === 'number' && toStart(start) !== undefined) item.start = start;
		result.push(item);
	}
	return result.slice(0, historyLimit);
}
