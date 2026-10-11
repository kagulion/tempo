// Клиент для Radio Browser API (https://www.radio-browser.info) — открытая база радиостанций

export type Station = {
	stationuuid: string;
	name: string;
	country: string;
	countrycode: string;
	url_resolved: string;
	codec: string;
	hls: number;
};

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

// Кодеки, которые браузеры играют без дополнительных библиотек
const playableCodecs = ['MP3', 'AAC', 'AAC+', 'OGG'];

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

export async function fetchStations(countryCode: string) {
	const params = new URLSearchParams({
		limit: '300',
		order: 'votes',
		reverse: 'true',
		hidebroken: 'true',
		countrycode: countryCode
	});

	const stations = await request<Station[]>(`/stations/search?${params}`);

	// В базе бывают копии одной станции с разными адресами — оставляем самую популярную
	const seen = new Set<string>();

	return stations.filter((station) => {
		// На https-сайте браузер не даст играть http-потоки, а HLS требует отдельного плеера
		const playable =
			station.url_resolved.startsWith('https://') &&
			!station.hls &&
			!station.url_resolved.includes('.m3u8') &&
			playableCodecs.includes(station.codec.toUpperCase());
		if (!playable) return false;

		const key = `${station.name.trim().toLowerCase()}|${station.countrycode}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
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
