// Логика списков радиостанций без React и сети: источники, сортировка, место станции в очереди
import { getGenre, type GenreId } from './genres';
import type { RecordStation } from './record';

// Откуда берём станции: все станции Рекорда или наш пресет для фокуса
export type StationSource = { kind: 'all' } | { kind: 'genre'; genre: GenreId };

// shuffle — случайный порядок, default — порядок Рекорда (у пресета — порядок в пресете)
export type RadioSort = 'shuffle' | 'default';

// Станции источника в порядке по умолчанию. Для пресета — по порядку prefix в пресете
export function stationsForSource(all: RecordStation[], source: StationSource) {
	if (source.kind === 'all') return all;

	const byPrefix = new Map(all.map((item) => [item.prefix, item]));
	const seen = new Set<number>();
	const result: RecordStation[] = [];
	for (const prefix of getGenre(source.genre)?.prefixes ?? []) {
		const item = byPrefix.get(prefix);
		if (!item || seen.has(item.id)) continue;
		seen.add(item.id);
		result.push(item);
	}
	return result;
}

function shuffled<T>(items: T[], random: () => number) {
	const result = [...items];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

// shuffle — чтобы каждый раз звучало что-то новое; default — список как пришёл
export function sortStations(
	stations: RecordStation[],
	sort: RadioSort,
	random: () => number = Math.random
) {
	return sort === 'shuffle' ? shuffled(stations, random) : [...stations];
}

// Ставит станцию first в уже отсортированный список и возвращает её номер.
// Если она в списке есть — остаётся где была, иначе встаёт в начало
export function placeStation(sorted: RecordStation[], first: RecordStation) {
	const existing = sorted.findIndex((item) => item.id === first.id);
	if (existing !== -1) return { list: sorted, index: existing };
	return { list: [first, ...sorted], index: 0 };
}

// Локальный поиск по названию без учёта регистра и пробелов по краям
export function filterStations(stations: RecordStation[], query: string) {
	const text = query.trim().toLowerCase();
	if (!text) return stations;
	return stations.filter((item) => item.title.toLowerCase().includes(text));
}
