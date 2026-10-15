// Пресеты жанров. В Radio Browser несколько тегов в одном запросе означают логическое И,
// поэтому на каждый тег уходит отдельный запрос, а результаты сливаются (см. stations.ts)

export type GenreId =
	'lofi' | 'medieval' | 'jazz' | 'classical' | 'ambient' | 'chillout' | 'synthwave' | 'piano';

export type Genre = {
	id: GenreId;
	label: string;
	tags: string[];
	// Проверенные станции (stationuuid): встают в начало выдачи
	curated?: string[];
	// Станции, которые попадают под теги, но не подходят по духу (stationuuid)
	excluded?: string[];
};

export const genres: Genre[] = [
	{
		id: 'lofi',
		label: 'Lo-fi',
		tags: ['lofi', 'lo-fi', 'chillhop', 'lofi hip hop'],
		curated: [
			'4e681355-3ebb-4b6c-a79a-d7cc81a0afd5', // REYFM -#LOFI
			'c1484aa5-b758-47a1-b098-69db58d6fb78', // I Love Music - I Love Chillhop
			'ab9697c4-f1cf-48bc-b4d8-4d15ad5618fa', // NIA Radio Lo-Fi
			'c72d442a-d73b-40f1-b741-e143b620eecf', // Epic Lounge - JAZZHOP
			'49902d2d-672d-4130-b42a-90592d0460c5', // 0R - LO-FI
			'22ed63fd-57bf-469a-9c71-4524834b74d0', // 0nlineradio LO-FI
			'22b4735f-78fe-41db-bb98-800333352815' // Epic Lounge - WORKDAY LOUNGE
		],
		excluded: [
			'15d870bb-86aa-4f97-8360-b586f71886d4' // Radio Digital Malayali
		]
	},
	{
		id: 'medieval',
		label: 'Medieval',
		tags: ['medieval', 'celtic', 'fantasy', 'renaissance', 'early music'],
		curated: [
			'aa6ee95d-e208-4592-a121-047056106596', // Ancient FM (Canada)
			'a96e06f8-4d64-11ea-b877-52543be04c81', // Celtcast
			'80d51b29-02d0-48e6-a1b5-a613daa79a3c', // Radio Rivendell
			'0604e118-822d-437d-aeee-b3aa37ad18f9', // CRB - Boston Early Music
			'86d4122b-8c50-4515-8824-4f91bb7fc8de' // SomaFM ThistleRadio (128k MP3)
		],
		// Под эти теги попадает много постороннего: церковное и готическое радио, фантастика
		excluded: [
			'1b0cb1d8-9e80-11e8-a767-52543be04c81', // Ancient Faith Radio
			'c2f56cc5-f369-11e8-a471-52543be04c81', // Gothic on Radio (MP3)
			'f0a32eff-f369-11e8-a471-52543be04c81', // Gothic on Radio (AAC+)
			'b7733197-1f7d-462e-a804-d49e1b35c09a', // 105'5 Spreeradio - Wellness
			'e2678020-6b6f-4a67-be14-756ada217702', // Scifi Radio
			'bcf65bb3-a449-40c2-9159-dda8d4792b19' // SomaFM SF in SF
		]
	},
	{ id: 'jazz', label: 'Jazz', tags: ['jazz'] },
	{ id: 'classical', label: 'Classical', tags: ['classical'] },
	{ id: 'ambient', label: 'Ambient', tags: ['ambient'] },
	{ id: 'chillout', label: 'Chillout', tags: ['chillout'] },
	{ id: 'synthwave', label: 'Synthwave', tags: ['synthwave'] },
	{ id: 'piano', label: 'Piano', tags: ['piano'] }
];

export function getGenre(id: GenreId) {
	return genres.find((genre) => genre.id === id);
}

export function isGenreId(value: unknown): value is GenreId {
	return genres.some((genre) => genre.id === value);
}
