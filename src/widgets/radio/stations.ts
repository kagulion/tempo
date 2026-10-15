// Логика списков радиостанций без React и сети: источники, фильтры, слияние, сортировка
import { getGenre, isGenreId, type GenreId } from './genres';

export type Station = {
	stationuuid: string;
	name: string;
	country: string;
	countrycode: string;
	url_resolved: string;
	codec: string;
	hls: number;
	votes: number;
	clickcount: number;
	tags: string;
};

// Откуда берём станции: страна, жанровый пресет или поиск по названию по всем странам
export type StationSource =
	| { kind: 'country'; code: string }
	| { kind: 'genre'; genre: GenreId }
	| { kind: 'search'; query: string };

// shuffle — случайный порядок, popular — по голосам
export type RadioSort = 'shuffle' | 'popular';

// Кодеки, которые браузеры играют без дополнительных библиотек
const playableCodecs = ['MP3', 'AAC', 'AAC+', 'OGG'];

// Поиск по названию начинается с двух символов: один даёт слишком случайную выдачу
export const minSearchLength = 2;

function toCount(value: unknown) {
	return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}

function toText(value: unknown) {
	return typeof value === 'string' ? value : '';
}

// Приводит станцию из API или из localStorage к типу Station. В старых сохранённых данных нет
// votes, clickcount и tags — считаем их нулём и пустой строкой. undefined — это не станция
export function normalizeStation(raw: unknown): Station | undefined {
	if (typeof raw !== 'object' || raw === null) return undefined;
	const item = raw as Record<string, unknown>;
	if (
		typeof item.stationuuid !== 'string' ||
		typeof item.countrycode !== 'string' ||
		typeof item.url_resolved !== 'string'
	) {
		return undefined;
	}

	return {
		stationuuid: item.stationuuid,
		name: toText(item.name),
		country: toText(item.country),
		countrycode: item.countrycode,
		url_resolved: item.url_resolved,
		codec: toText(item.codec),
		hls: toCount(item.hls),
		votes: toCount(item.votes),
		clickcount: toCount(item.clickcount),
		tags: toText(item.tags)
	};
}

export function normalizeStations(raw: unknown): Station[] {
	if (!Array.isArray(raw)) return [];
	return raw.flatMap((item) => normalizeStation(item) ?? []);
}

// Параметры запросов к /stations/search. Для жанра их несколько — по запросу на тег
export function buildSearchParams(source: StationSource): URLSearchParams[] {
	switch (source.kind) {
		case 'country':
			return [
				new URLSearchParams({
					limit: '300',
					order: 'votes',
					reverse: 'true',
					hidebroken: 'true',
					countrycode: source.code
				})
			];
		case 'search':
			// Без countrycode: ищем по всем странам
			return [
				new URLSearchParams({
					name: source.query.trim(),
					limit: '100',
					order: 'votes',
					reverse: 'true',
					hidebroken: 'true'
				})
			];
		case 'genre':
			// tagExact нужен, иначе в выдачу попадают теги, лишь содержащие слово (baroque → Bee Gees)
			return (getGenre(source.genre)?.tags ?? []).map(
				(tag) =>
					new URLSearchParams({
						tag,
						tagExact: 'true',
						hidebroken: 'true',
						order: 'votes',
						reverse: 'true',
						limit: '100'
					})
			);
	}
}

// Годится ли поток для воспроизведения в браузере на https-сайте
export function isPlayable(station: Station) {
	return (
		station.url_resolved.startsWith('https://') &&
		!station.hls &&
		!station.url_resolved.includes('.m3u8') &&
		playableCodecs.includes(station.codec.toUpperCase())
	);
}

// Оставляет играбельные станции и убирает копии одной станции (имя + страна): в базе они бывают
// с разными адресами. Остаётся первая, поэтому список нужно отдавать уже по убыванию популярности
export function filterPlayable(stations: Station[]) {
	const seen = new Set<string>();

	return stations.filter((station) => {
		if (!isPlayable(station)) return false;

		const key = `${station.name.trim().toLowerCase()}|${station.countrycode}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

// Склеивает списки без повторов по stationuuid: побеждает первое вхождение
export function mergeStations(...lists: Station[][]) {
	const seen = new Set<string>();
	const result: Station[] = [];

	for (const list of lists) {
		for (const station of list) {
			if (seen.has(station.stationuuid)) continue;
			seen.add(station.stationuuid);
			result.push(station);
		}
	}

	return result;
}

// Список жанра: проверенные станции первыми, затем найденные по тегам, без лишних
export function buildGenreList(genreId: GenreId, curated: Station[], tagged: Station[]) {
	const excluded = new Set(getGenre(genreId)?.excluded ?? []);
	const wanted = mergeStations(curated, tagged).filter((item) => !excluded.has(item.stationuuid));

	return filterPlayable(wanted);
}

// Uuid проверенных станций жанра: при сортировке они остаются в начале
export function curatedIds(source: StationSource) {
	return source.kind === 'genre' ? (getGenre(source.genre)?.curated ?? []) : [];
}

function shuffled<T>(items: T[], random: () => number) {
	const result = [...items];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

// Сначала по голосам, при равенстве — по числу кликов
function byPopularity(a: Station, b: Station) {
	return b.votes - a.votes || b.clickcount - a.clickcount;
}

// shuffle — чтобы каждый раз звучало что-то новое, а не одни и те же лидеры рейтинга.
// pinned — uuid станций, которые идут в начале; учитывается только в режиме shuffle: порядок
// «Популярные» строго по голосам, иначе список и «Далее» выглядят перемешанными
export function sortStations(
	stations: Station[],
	sort: RadioSort,
	pinned: string[] = [],
	random: () => number = Math.random
) {
	if (sort === 'popular') return [...stations].sort(byPopularity);

	const pinnedSet = new Set(pinned);
	return [
		...shuffled(
			stations.filter((item) => pinnedSet.has(item.stationuuid)),
			random
		),
		...shuffled(
			stations.filter((item) => !pinnedSet.has(item.stationuuid)),
			random
		)
	];
}

// Ставит станцию first на её место в уже отсортированном списке и возвращает номер станции.
// Если она в списке есть — остаётся где была. Если нет: «Популярные» — встаёт по голосам,
// «Перемешать» — в начало
export function placeStation(sorted: Station[], first: Station, sort: RadioSort) {
	const existing = sorted.findIndex((item) => item.stationuuid === first.stationuuid);
	if (existing !== -1) return { list: sorted, index: existing };

	if (sort === 'shuffle') return { list: [first, ...sorted], index: 0 };

	const found = sorted.findIndex((item) => byPopularity(first, item) < 0);
	const index = found === -1 ? sorted.length : found;
	return { list: [...sorted.slice(0, index), first, ...sorted.slice(index)], index };
}

// Число голосов коротко: 950, 1.2k, 12k
export function formatCount(count: number) {
	if (count < 1000) return String(Math.max(0, Math.floor(count)));
	if (count < 10_000) return `${(Math.floor(count / 100) / 10).toString()}k`;
	return `${Math.floor(count / 1000)}k`;
}

// Сохранённые настройки радио: разбор того, что лежит в localStorage
export function parseSource(saved: unknown): StationSource | undefined {
	if (typeof saved !== 'object' || saved === null) return undefined;
	const item = saved as Record<string, unknown>;

	if (item.kind === 'country' && typeof item.code === 'string' && item.code) {
		return { kind: 'country', code: item.code };
	}
	if (item.kind === 'genre' && isGenreId(item.genre)) {
		return { kind: 'genre', genre: item.genre };
	}
	if (item.kind === 'search' && typeof item.query === 'string') {
		return { kind: 'search', query: item.query };
	}
	return undefined;
}

export function parseSort(saved: unknown): RadioSort | undefined {
	return saved === 'shuffle' || saved === 'popular' ? saved : undefined;
}

// Станции, за которые уже проголосовали: uuid → время голоса (мс)
export function parseLiked(saved: unknown): Record<string, number> | undefined {
	if (typeof saved !== 'object' || saved === null || Array.isArray(saved)) return undefined;

	const result: Record<string, number> = {};
	for (const [uuid, time] of Object.entries(saved)) {
		if (typeof time === 'number' && Number.isFinite(time)) result[uuid] = time;
	}
	return result;
}

// Избранное: плохие записи отбрасываем, у старых добавляем недостающие поля
export function parseStationMap(saved: unknown): Record<string, Station> | undefined {
	if (typeof saved !== 'object' || saved === null || Array.isArray(saved)) return undefined;

	const result: Record<string, Station> = {};
	for (const value of Object.values(saved)) {
		const station = normalizeStation(value);
		if (station) result[station.stationuuid] = station;
	}
	return result;
}
