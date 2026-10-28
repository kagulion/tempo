import { toStart, videoIdPattern, type YouTubeVideo } from '@/lib/youtube/links';

// Фон-видео YouTube: id обоев, ошибки и история последних видео. Чистый модуль без React: его легко тестировать

// Элемент истории: видео и название, которое мы узнали у плеера
export type YouTubeHistoryItem = YouTubeVideo & {
	title?: string;
};

// Сколько видео помнит история
export const historyLimit = 8;

const wallpaperIdPattern = /^youtube\/([A-Za-z0-9_-]{11})$/;

// id обоев в localStorage и в списке обоев: youtube/<videoId>
export function youtubeWallpaperId(videoId: string) {
	return `youtube/${videoId}`;
}

export function parseYoutubeWallpaperId(id: unknown): string | undefined {
	return typeof id === 'string' ? wallpaperIdPattern.exec(id)?.[1] : undefined;
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
