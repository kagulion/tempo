// Сохранённые настройки радио: разбор того, что лежит в localStorage, и перевод старых форматов
// (Radio Browser) в формат «Радио Рекорд». Без React и сети
//
// Станции (избранное и последняя) хранятся целиком, как RecordStation: так их можно показать и
// включить без запроса к API. Старые станции сопоставляются по снимку станций из репозитория
import { isRecord, type Parse } from '@/lib/storage';

import { isGenreId, type GenreId } from './genres';
import type { RecordStation } from './record';
import snapshot from './record-stations.json';
import type { RadioSort, StationSource } from './stations';

// Поток Рекорда в Radio Browser лежит на этом хосте
const recordHost = 'radiorecord.hostingradio.ru';

function fileName(url: string) {
	try {
		const parsed = new URL(url);
		if (parsed.hostname.toLowerCase() !== recordHost) return undefined;
		return parsed.pathname.split('/').pop()?.toLowerCase() || undefined;
	} catch {
		return undefined;
	}
}

// Имя файла без цифр битрейта на конце (deep64.aacp → deep.aacp): в Radio Browser битрейт мог
// отличаться от нашего
function baseName(file: string) {
	return file.replace(/\d+(\.[a-z0-9]+)$/, '$1');
}

// Станция Рекорда по адресу потока из Radio Browser: http/https и регистр не важны.
// undefined — адрес не Рекорда или такой станции нет
export function findStationByUrl(url: unknown, stations: RecordStation[] = snapshotStations) {
	if (typeof url !== 'string') return undefined;
	const file = fileName(url);
	if (!file) return undefined;

	const exact = stations.find((item) => fileName(item.stream) === file);
	if (exact) return exact;

	const base = baseName(file);
	const similar = stations.filter((item) => baseName(fileName(item.stream) ?? '') === base);
	return similar.length === 1 ? similar[0] : undefined;
}

function toHttps(value: unknown) {
	return typeof value === 'string' && /^https:\/\/\S+$/i.test(value) ? value : undefined;
}

// Станция в новом формате. Бесконечный sort при записи в JSON превращается в null — возвращаем Infinity
function parseRecordStation(raw: Record<string, unknown>): RecordStation | undefined {
	const { id, title, prefix } = raw;
	const stream = toHttps(raw.stream);
	if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) return undefined;
	if (typeof title !== 'string' || !title.trim() || !stream) return undefined;

	const station: RecordStation = {
		id,
		prefix: typeof prefix === 'string' ? prefix : '',
		title: title.trim(),
		genres: Array.isArray(raw.genres)
			? raw.genres.filter((g): g is string => typeof g === 'string')
			: [],
		stream,
		sort: typeof raw.sort === 'number' && Number.isFinite(raw.sort) ? raw.sort : Infinity
	};
	const hls = toHttps(raw.hls);
	const icon = toHttps(raw.icon);
	if (hls) station.hls = hls;
	if (icon) station.icon = icon;
	if (typeof raw.color === 'string' && raw.color) station.color = raw.color;
	return station;
}

// Станция из сохранения: новый формат читается как есть, станция Radio Browser переводится
// в станцию Рекорда, остальное (чужие радио, мусор) отбрасывается
export function migrateStation(
	saved: unknown,
	stations: RecordStation[] = snapshotStations
): RecordStation | undefined {
	if (!isRecord(saved)) return undefined;
	if ('stream' in saved) return parseRecordStation(saved);
	return findStationByUrl(saved.url_resolved, stations);
}

export const parseStation: Parse<RecordStation> = (saved) => migrateStation(saved);

// Избранное: id Рекорда → станция. У старого сохранения ключом был stationuuid
export const parseStationMap: Parse<Record<string, RecordStation>> = (saved) => {
	if (!isRecord(saved)) return undefined;

	const result: Record<string, RecordStation> = {};
	for (const value of Object.values(saved)) {
		const station = migrateStation(value);
		if (station) result[String(station.id)] = station;
	}
	return result;
};

// Старые жанры Radio Browser, у которых есть пресет в новом списке
const legacyGenres: Record<string, GenreId> = {
	lofi: 'lofi',
	ambient: 'ambient',
	chillout: 'chillout'
};

export const parseSource: Parse<StationSource> = (saved) => {
	if (!isRecord(saved)) return undefined;
	if (saved.kind === 'all') return { kind: 'all' };
	if (saved.kind === 'genre') {
		if (isGenreId(saved.genre)) return { kind: 'genre', genre: saved.genre };
		if (typeof saved.genre === 'string' && saved.genre in legacyGenres) {
			return { kind: 'genre', genre: legacyGenres[saved.genre] };
		}
		// Жанр, которого больше нет
		return { kind: 'all' };
	}
	// Страна и поиск из Radio Browser
	if (saved.kind === 'country' || saved.kind === 'search') return { kind: 'all' };
	return undefined;
};

export const parseSort: Parse<RadioSort> = (saved) => {
	if (saved === 'shuffle' || saved === 'default') return saved;
	// Голосов в Рекорде нет
	return saved === 'popular' ? 'default' : undefined;
};

// Снимок станций из репозитория (pnpm record:snapshot). В файле уже нормализованные станции
// (RecordStation[]), а не сырой ответ API, поэтому читаются они тем же разбором, что и сохранённые
export const snapshotStations: RecordStation[] = (Array.isArray(snapshot) ? snapshot : []).flatMap(
	(item: unknown) => (isRecord(item) ? (parseRecordStation(item) ?? []) : [])
);
