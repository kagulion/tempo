// Ссылки на видео YouTube: id и время старта. Чистый модуль без React

export type YouTubeVideo = {
	videoId: string;
	// Секунда, с которой начинать и к которой возвращаться при зацикливании
	start?: number;
};

export const videoIdPattern = /^[A-Za-z0-9_-]{11}$/;

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

export function toStart(seconds: number) {
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
