// Клиент для Radio Browser API (https://www.radio-browser.info) — открытая база радиостанций
import { getGenre } from './genres';
import {
	buildGenreList,
	buildSearchParams,
	filterPlayable,
	normalizeStations,
	type Station,
	type StationSource
} from './stations';

export type { Station, StationSource };

type Country = {
	iso_3166_1: string;
	stationcount: number;
};

// Зеркала API: если одно недоступно, пробуем следующее
const mirrors = [
	'https://de1.api.radio-browser.info',
	'https://de2.api.radio-browser.info',
	'https://fi1.api.radio-browser.info'
];

async function request<T>(path: string): Promise<T> {
	let lastError: unknown;

	for (const mirror of mirrors) {
		try {
			// Зеркала иногда зависают — не ждём дольше 5 секунд и идём к следующему
			const res = await fetch(`${mirror}/json${path}`, { signal: AbortSignal.timeout(5000) });
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			return await res.json();
		} catch (error) {
			lastError = error;
		}
	}

	throw lastError;
}

async function searchStations(params: URLSearchParams) {
	return normalizeStations(await request<unknown>(`/stations/search?${params}`));
}

// Проверенные станции жанра по uuid. Не получилось загрузить — обойдёмся станциями по тегам
async function fetchCuratedStations(uuids: string[]) {
	if (uuids.length === 0) return [];
	try {
		return normalizeStations(await request<unknown>(`/stations/byuuid?uuids=${uuids.join(',')}`));
	} catch {
		return [];
	}
}

export async function fetchStations(source: StationSource) {
	if (source.kind !== 'genre') {
		const [params] = buildSearchParams(source);
		// Станции в ответе уже по убыванию голосов: из копий остаётся самая популярная
		return filterPlayable(await searchStations(params));
	}

	const curatedUuids = getGenre(source.genre)?.curated ?? [];
	const [curated, ...results] = await Promise.allSettled([
		fetchCuratedStations(curatedUuids),
		...buildSearchParams(source).map(searchStations)
	]);
	const lists = results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));
	// Ни один запрос по тегам не удался — это ошибка, а не пустой жанр
	if (lists.length === 0) throw new Error('Не удалось загрузить жанр');

	// Проверенные станции встают в начало в том порядке, в каком перечислены в пресете
	const byUuid = new Map(
		(curated.status === 'fulfilled' ? curated.value : []).map((item) => [item.stationuuid, item])
	);
	const ordered = curatedUuids.flatMap((uuid) => byUuid.get(uuid) ?? []);
	return buildGenreList(
		source.genre,
		ordered,
		lists.flat().sort((a, b) => b.votes - a.votes)
	);
}

export type VoteResult = { ok: boolean; message: string };

// Голос за станцию. Ограничение API: один голос с одного IP за станцию раз в 10 минут, отозвать нельзя
export async function voteStation(uuid: string): Promise<VoteResult> {
	for (const mirror of mirrors) {
		try {
			const res = await fetch(`${mirror}/json/vote/${encodeURIComponent(uuid)}`, {
				signal: AbortSignal.timeout(5000)
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data: unknown = await res.json();
			const ok =
				typeof data === 'object' && data !== null && (data as { ok?: unknown }).ok === true;
			const message = String((data as { message?: unknown } | null)?.message ?? '');
			// Ответ сервера окончателен: на другом зеркале голос не примут, а то и засчитают дважды
			return { ok, message: ok ? message : voteErrorText(message) };
		} catch {
			// Зеркало недоступно или не разрешает запрос — пробуем следующее
		}
	}

	return { ok: false, message: 'Нет связи с сервером радио' };
}

function voteErrorText(message: string) {
	if (message.toLowerCase().includes('too fast')) {
		return 'За эту станцию уже голосовали: повторить можно через 10 минут';
	}
	return message || 'Голос не принят';
}

// Начало воспроизведения станции: по документации Radio Browser так засчитывается клик
export async function countStationClick(uuid: string) {
	try {
		await request(`/url/${encodeURIComponent(uuid)}`);
	} catch {
		// Счётчик кликов не важен для пользователя
	}
}

export type RadioCountry = {
	code: string;
	name: string;
	stationCount: number;
};

// Названия стран по-русски — API отдаёт их только на английском
const countryNames = new Intl.DisplayNames(['ru'], { type: 'region' });

export function countryName(code: string) {
	try {
		return countryNames.of(code) ?? code;
	} catch {
		// Нестандартный код страны — показываем как есть
		return code;
	}
}

export async function fetchCountries(): Promise<RadioCountry[]> {
	const countries = await request<Country[]>('/countries');

	return (
		countries
			// В странах с парой станций после фильтрации обычно не остаётся ничего рабочего
			.filter((country) => country.iso_3166_1 && country.stationcount >= 10)
			.map((country) => ({
				code: country.iso_3166_1,
				name: countryName(country.iso_3166_1),
				stationCount: country.stationcount
			}))
			.sort((a, b) => a.name.localeCompare(b.name, 'ru'))
	);
}

// Страна по умолчанию — по языку браузера, например ru-RU → RU
export function detectCountryCode() {
	try {
		return new Intl.Locale(navigator.language).maximize().region ?? 'US';
	} catch {
		return 'US';
	}
}
