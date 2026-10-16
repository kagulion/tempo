export type TvCategory = 'music' | 'relax' | 'nature' | 'travel';

export type TvChannel = {
	id: string; // id канала из iptv-org, например 'Example.us'
	title: string; // название канала как есть
	category: TvCategory;
	url: string; // https-ссылка на .m3u8
	logo?: string; // https-ссылка на логотип, если есть
	country?: string; // код страны, 'US'
};

export const tvCategories: { value: TvCategory; label: string }[] = [
	{ value: 'music', label: 'Музыка' },
	{ value: 'relax', label: 'Релакс' },
	{ value: 'nature', label: 'Природа' },
	{ value: 'travel', label: 'Путешествия' }
];

// Отобрано из каталога iptv-org. Каждый поток проверен: https, заголовок Access-Control-Allow-Origin,
// ответ — плейлист #EXTM3U (для master-плейлиста проверен один вложенный вариант).
// Нейтральный контент: музыка, виды природы, путешествия; без новостей и магазинов.
export const tvChannels: TvChannel[] = [
	{
		id: 'BarazaTVRelaxing.gr',
		title: 'Baraza TV Relaxing',
		category: 'music',
		url: 'https://rtmp.streams.ovh:1936/barazarelax/barazarelax/playlist.m3u8',
		logo: 'https://i.imgur.com/TZ1unwF.png',
		country: 'GR'
	},
	{
		id: 'PowerTurkAkustik.tr',
		title: 'PowerTurk Akustik',
		category: 'music',
		url: 'https://livetv.powerapp.com.tr/pturkakustik/akustik.smil/playlist.m3u8',
		logo: 'https://i.imgur.com/driabBO.png',
		country: 'TR'
	},
	{
		id: 'QwestTVJazzBeyond.fr',
		title: 'Qwest TV Jazz & Beyond',
		category: 'music',
		url: 'https://samsungau-qwestjazz-samsungtv-zw2jc.amagi.tv/playlist/samsungau-qwestjazz-samsungtv/playlist.m3u8',
		logo: 'https://i.imgur.com/89yWH5L.png',
		country: 'FR'
	},
	{
		id: 'MovieMusicbyStingray.ca',
		title: 'Movie Music by Stingray',
		category: 'music',
		url: 'https://lotus.stingray.com/manifest/cmusic-cme004-montreal/samsungtvplus/master.m3u8',
		logo: 'https://provider-static.plex.tv/epg/cms/production/a28301e1-00c2-4783-9a44-1e822be96cb9/11810_MMS_Plex-TV_Channel-Logo_1500x1000_V01-Color-Rev.png',
		country: 'CA'
	},
	{
		id: 'LoveNature.ca',
		title: 'Love Nature',
		category: 'nature',
		url: 'https://pb-ehs1glsha1juy.akamaized.net/Love_Nature_4K.m3u8',
		logo: 'https://tv.lovenature.com/wp-content/uploads/2024/10/LoveNature2024_Logo_full_colour-copy.png',
		country: 'CA'
	},
	{
		id: 'WaterBear.ch',
		title: 'WaterBear',
		category: 'nature',
		url: 'https://amg01415-waterbearnetwor-waterbear-samsunguk-1h0y8.amagi.tv/playlist/amg01415-waterbearnetwor-waterbear-samsunguk/playlist.m3u8',
		logo: 'https://framerusercontent.com/images/41VQQ7F0fYlp1MX1N4Ixog5QnPI.png',
		country: 'CH'
	},
	{
		id: 'WildEarth.za',
		title: 'WildEarth',
		category: 'nature',
		url: 'https://dqga3jatxofgx.cloudfront.net/WildEarth.m3u8',
		logo: 'https://i.imgur.com/Vhv5gjN.png',
		country: 'ZA'
	},
	{
		id: 'ZenLIFEbyStingray.ca',
		title: 'ZenLIFE by Stingray',
		category: 'relax',
		url: 'https://lotus.stingray.com/manifest/zenlife-zen001-montreal/samsungtvplus/master.m3u8',
		logo: 'https://www.stingray.com/wp-content/uploads/2023/12/stingray_zenlifebystingray_white.svg',
		country: 'CA'
	},
	{
		id: 'ScreenDreams.us',
		title: 'Screen Dreams',
		category: 'relax',
		url: 'https://stream-us-east-1.getpublica.com/playlist.m3u8?network_id=2240',
		logo: 'https://i.imgur.com/AHIo9oz.png',
		country: 'US'
	},
	{
		id: 'BetterLifeNatureChannel.us',
		title: 'Better Life Nature Channel',
		category: 'relax',
		url: 'https://tgn.bozztv.com/betterlife/betternature/betternature/index.m3u8',
		logo: 'https://i.imgur.com/D8Vuw6I.png',
		country: 'US'
	},
	{
		id: 'SpaceLivepoweredbysen.uk',
		title: 'Space Live powered by sen',
		category: 'relax',
		url: 'https://d111bsx9oooqoh.cloudfront.net/playlist.m3u8',
		logo: 'https://tvpnlogopeu.samsungcloud.tv/platform/image/sourcelogo/vc/00/02/34/GB3800007C5_20251209T004625SQUARE.png',
		country: 'UK'
	},
	{
		id: 'DroneTV.us',
		title: 'DroneTV',
		category: 'travel',
		url: 'https://airvuz-dronetv-1-us.ohlscdn.wurl.tv/playlist.m3u8',
		logo: 'https://i.ibb.co/S71C9RJC/dronetv.webp',
		country: 'US'
	},
	{
		id: 'BeachTVKeyWestFloridaKeys.us',
		title: 'Beach TV Key West & Florida Keys',
		category: 'travel',
		url: 'https://5ed325193d4e1.streamlock.net:444/LiveTV/KTVHD/playlist.m3u8',
		logo: 'https://i.imgur.com/XhDBdff.png',
		country: 'US'
	},
	{
		id: 'BeachTVMyrtleBeachTheGrandStrand.us',
		title: 'Beach TV Myrtle Beach & The Grand Strand',
		category: 'travel',
		url: 'https://5ed325193d4e1.streamlock.net:444/LiveTV/MTVHD/playlist.m3u8',
		logo: 'https://i.imgur.com/aLYz7Bv.png',
		country: 'US'
	},
	{
		id: 'TVSTravelNetwork.us',
		title: 'TVS Travel Network',
		category: 'travel',
		url: 'https://rpn.bozztv.com/gusa/gusa-tvstravel/index.m3u8',
		logo: 'https://i.imgur.com/vSFf5Ce.png',
		country: 'US'
	}
];
