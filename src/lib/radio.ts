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
			const res = await fetch(`${mirror}/json${path}`);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			return await res.json();
		} catch (error) {
			lastError = error;
		}
	}

	throw lastError;
}

export async function fetchStations(countryCode?: string) {
	const params = new URLSearchParams({
		limit: '100',
		order: 'votes',
		reverse: 'true',
		hidebroken: 'true'
	});
	if (countryCode) params.set('countrycode', countryCode);

	const stations = await request<Station[]>(`/stations/search?${params}`);

	// На https-сайте браузер не даст играть http-потоки, а HLS требует отдельного плеера
	return stations.filter(
		(station) =>
			station.url_resolved.startsWith('https://') &&
			!station.hls &&
			!station.url_resolved.includes('.m3u8') &&
			playableCodecs.includes(station.codec.toUpperCase())
	);
}

export async function fetchRandomCountryCode() {
	const countries = await request<Country[]>('/countries');
	// Берём страны, где станций достаточно, чтобы было из чего выбрать
	const candidates = countries.filter(
		(country) => country.iso_3166_1 && country.stationcount >= 30
	);
	return candidates[Math.floor(Math.random() * candidates.length)].iso_3166_1;
}
