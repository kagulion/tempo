// Чистая логика отбора эфиров темы Rutube: список тем, фильтры и приоритеты. Без React и без сети:
// её запускает скрипт scripts/rutube-snapshot.ts и тестирует Vitest (topStreams.test.ts).
// Импорты внутри модуля не нужны: Node выполняет его без сборки

// Темы ТВ-эфиров Rutube
export const allowedTopics = [2, 5, 15, 8, 10] as const;

// Приоритет тем: эфир показываем только в самой приоритетной из своих тем, остальные вкладки его пропускают
export const topicPriority = [15, 8, 10, 5, 2] as const;

// Новости (3), Федеральные (4), Региональные (9): такие эфиры в подборку не берём
export const excludedTopics = [3, 4, 9] as const;

// Сколько эфиров темы просим у Rutube и сколько оставляем
export const upstreamLimit = 100;
export const topCount = 6;

export type RutubeStream = {
	id: string;
	title: string;
	author: string;
	thumbnail: string;
	hits: number;
};

const idPattern = /^[0-9a-f]{32}$/;

export function isAllowedTopic(value: number): value is (typeof allowedTopics)[number] {
	return (allowedTopics as readonly number[]).includes(value);
}

// Id темы из строки запроса. Допустимы только целые числа из белого списка
export function parseTopic(value: string | null): number | undefined {
	if (value === null || !/^[1-9]\d{0,2}$/.test(value)) return undefined;
	const topic = Number(value);
	return isAllowedTopic(topic) ? topic : undefined;
}

function text(value: unknown) {
	return typeof value === 'string' ? value.trim() : '';
}

// Id тем эфира: в `topics` бывают числа и объекты с `id`, встречаются дубли
export function topicIds(raw: unknown): Set<number> {
	const ids = new Set<number>();
	if (!Array.isArray(raw)) return ids;
	for (const entry of raw) {
		const value =
			typeof entry === 'object' && entry !== null ? (entry as Record<string, unknown>).id : entry;
		const id = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
		if (typeof id === 'number' && Number.isInteger(id)) ids.add(id);
	}
	return ids;
}

// Эфир подходит теме: нет исключённых тем и нет темы с более высоким приоритетом, чем у этой
function belongsTo(topics: Set<number>, topic: number) {
	if (excludedTopics.some((excluded) => topics.has(excluded))) return false;
	const higher = topicPriority.slice(0, topicPriority.indexOf(topic as never));
	return !higher.some((other) => topics.has(other));
}

// Один элемент ответа Rutube → наш эфир. Платные, для взрослых, без id или названия отбрасываем
function toStream(item: unknown, topic: number): RutubeStream | undefined {
	if (typeof item !== 'object' || item === null) return undefined;
	const raw = item as Record<string, unknown>;
	if (!belongsTo(topicIds(raw.topics), topic)) return undefined;
	if (raw.is_paid === true || raw.is_adult === true) return undefined;

	const id = text(raw.id);
	const title = text(raw.title);
	if (!idPattern.test(id) || title === '') return undefined;

	const author =
		typeof raw.author === 'object' && raw.author !== null
			? text((raw.author as Record<string, unknown>).name)
			: '';
	const hits = typeof raw.hits === 'number' && Number.isFinite(raw.hits) ? raw.hits : 0;
	return { id, title, author, thumbnail: text(raw.thumbnail_url), hits };
}

// Ответ Rutube по теме → не больше topCount эфиров. Федеральные каналы Rutube кладёт сразу в несколько тем, поэтому
// отбрасываем новости, федеральные и региональные, а каждый эфир оставляем в одной теме (см. topicPriority).
// Сортировки по популярности не делаем: порядок Rutube сохраняется
export function topStreams(response: unknown, topic: number, count = topCount): RutubeStream[] {
	if (typeof response !== 'object' || response === null) return [];
	const results = (response as Record<string, unknown>).results;
	if (!Array.isArray(results)) return [];

	const seen = new Set<string>();
	const streams: RutubeStream[] = [];
	for (const item of results) {
		const stream = toStream(item, topic);
		if (!stream || seen.has(stream.id)) continue;
		seen.add(stream.id);
		streams.push(stream);
		if (streams.length === count) break;
	}
	return streams;
}
