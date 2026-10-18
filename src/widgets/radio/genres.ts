// Пресеты для фокуса: наборы станций «Радио Рекорд», заданные списками prefix.
// Порядок prefix — порядок станций в режиме «По порядку». Станции, которых нет в ответе API, пропускаются

export type GenreId = 'lofi' | 'chillout' | 'ambient' | 'deep' | 'lounge' | 'melodic';

export type Genre = {
	id: GenreId;
	label: string;
	// prefix станций Рекорда
	prefixes: string[];
};

// Фокусные пресеты первыми
export const genres: Genre[] = [
	{ id: 'lofi', label: 'Lo-Fi', prefixes: ['lofi', 'lo-fi-house', 'dream-pop', 'organic'] },
	{
		id: 'chillout',
		label: 'Chill',
		prefixes: ['chil', 'chillhouse', 'summerlounge', 'organic', 'trop']
	},
	{ id: 'ambient', label: 'Ambient', prefixes: ['ambient', 'chil', 'dream-pop'] },
	{ id: 'deep', label: 'Deep', prefixes: ['deep', 'organic', 'mini', 'progr'] },
	{ id: 'lounge', label: 'Lounge', prefixes: ['summerlounge', 'trop', 'afro', 'beach'] },
	{ id: 'melodic', label: 'Melodic', prefixes: ['melodic', 'feel', 'tm', 'trancehouse'] }
];

export function getGenre(id: GenreId) {
	return genres.find((genre) => genre.id === id);
}

export function isGenreId(value: unknown): value is GenreId {
	return genres.some((genre) => genre.id === value);
}
