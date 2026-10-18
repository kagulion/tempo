// Данные «Радио Рекорд» без React и сети: типы и приведение ответов API к нашим типам

export type RecordStation = {
	id: number;
	prefix: string;
	title: string;
	genres: string[];
	// https-поток: 128 кбит/с, при его отсутствии 320, затем 64
	stream: string;
	hls?: string;
	color?: string;
	icon?: string;
	sort: number;
};

export type RecordTrack = {
	stationId: number;
	artist: string;
	song: string;
	cover?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toText(value: unknown) {
	return typeof value === 'string' ? value.trim() : '';
}

// Только https: страница открывается по https, http-поток браузер заблокирует
function toHttps(value: unknown) {
	const text = toText(value);
	return /^https:\/\/\S+$/i.test(text) ? text : undefined;
}

function toId(value: unknown) {
	return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;
}

// Ответ приходит как { result: { stations } } / { result: [...] } или уже массивом
function unwrapList(raw: unknown, key?: string): unknown[] {
	if (Array.isArray(raw)) return raw;
	if (!isRecord(raw)) return [];
	const result = raw.result;
	if (Array.isArray(result)) return result;
	if (isRecord(result)) {
		const list = key ? result[key] : undefined;
		if (Array.isArray(list)) return list;
	}
	return [];
}

function normalizeStation(raw: unknown): RecordStation | null {
	if (!isRecord(raw)) return null;
	const id = toId(raw.id);
	const title = toText(raw.title);
	const stream = toHttps(raw.stream_128) ?? toHttps(raw.stream_320) ?? toHttps(raw.stream_64);
	if (id === null || !title || !stream) return null;

	const genres = Array.isArray(raw.genre)
		? raw.genre.map((g) => (isRecord(g) ? toText(g.name) : '')).filter(Boolean)
		: [];
	const sort = typeof raw.sort === 'number' && Number.isFinite(raw.sort) ? raw.sort : Infinity;

	const station: RecordStation = { id, prefix: toText(raw.prefix), title, genres, stream, sort };
	const hls = toHttps(raw.stream_hls);
	const color = toText(raw.bg_color);
	const icon = toHttps(raw.icon_fill_colored);
	if (hls) station.hls = hls;
	if (color) station.color = color;
	if (icon) station.icon = icon;
	return station;
}

// Принимает полный ответ API или массив станций. Негодные записи отбрасывает, остальные сортирует по sort
export function normalizeRecordStations(raw: unknown): RecordStation[] {
	const seen = new Set<number>();
	const stations: RecordStation[] = [];
	for (const item of unwrapList(raw, 'stations')) {
		const station = normalizeStation(item);
		if (!station || seen.has(station.id)) continue;
		seen.add(station.id);
		stations.push(station);
	}
	// Станции без sort уходят в конец. Сортировка устойчивая, порядок API сохраняется
	return stations.sort((a, b) => (a.sort === b.sort ? 0 : a.sort < b.sort ? -1 : 1));
}

// Что сейчас играет на станциях. Записи без id станции или без названия трека отбрасываются
export function normalizeRecordNow(raw: unknown): RecordTrack[] {
	const tracks: RecordTrack[] = [];
	for (const item of unwrapList(raw)) {
		if (!isRecord(item) || !isRecord(item.track)) continue;
		const stationId = toId(item.id);
		const song = toText(item.track.song);
		if (stationId === null || !song) continue;

		const track: RecordTrack = { stationId, artist: toText(item.track.artist), song };
		const cover =
			toHttps(item.track.image200) ?? toHttps(item.track.image100) ?? toHttps(item.track.image600);
		if (cover) track.cover = cover;
		tracks.push(track);
	}
	return tracks;
}
