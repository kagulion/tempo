import allianceTavern from '@/assets/wallpapers/alliance/alliance-tavern.webp?url';
import dwarfsTavern from '@/assets/wallpapers/alliance/dwarfs-tavern.webp?url';
import elfsTavern from '@/assets/wallpapers/alliance/elfs-tavern.webp?url';
import bloodElfsTavern from '@/assets/wallpapers/horde/bloody-elfs-tavern.webp?url';
import orcsTavern from '@/assets/wallpapers/horde/orcs-tavern.webp?url';
import taurenTavern from '@/assets/wallpapers/horde/tauren-tavern.webp?url';
import allianceTavernThumb from '@/assets/wallpapers/thumbs/alliance/alliance-tavern.webp?url';
import dwarfsTavernThumb from '@/assets/wallpapers/thumbs/alliance/dwarfs-tavern.webp?url';
import elfsTavernThumb from '@/assets/wallpapers/thumbs/alliance/elfs-tavern.webp?url';
import bloodElfsTavernThumb from '@/assets/wallpapers/thumbs/horde/bloody-elfs-tavern.webp?url';
import orcsTavernThumb from '@/assets/wallpapers/thumbs/horde/orcs-tavern.webp?url';
import taurenTavernThumb from '@/assets/wallpapers/thumbs/horde/tauren-tavern.webp?url';
import cafeThumb from '@/assets/wallpapers/thumbs/japan/cafe.webp?url';
import sakuraThumb from '@/assets/wallpapers/thumbs/japan/sakura.webp?url';
import villageThumb from '@/assets/wallpapers/thumbs/japan/village.webp?url';
import ashenvaleThumb from '@/assets/wallpapers/thumbs/warcraft/ashenvale.webp?url';
import bootyBayThumb from '@/assets/wallpapers/thumbs/warcraft/booty-bay.webp?url';
import dragonflightThumb from '@/assets/wallpapers/thumbs/warcraft/dragonflight.webp?url';
import pandariaThumb from '@/assets/wallpapers/thumbs/warcraft/mists-of-pandaria.webp?url';
import nightElfThumb from '@/assets/wallpapers/thumbs/warcraft/night-elf.webp?url';

import {
	buildImageSources,
	buildThumbSrcSet,
	buildVideoSources,
	videoFile,
	type ImageSources,
	type VideoSource
} from './variants';
import {
	type YouTubeHistoryItem,
	youtubeThumb,
	youtubeWallpaperId
} from '@/widgets/youtube/youtube';

export type Category = 'alliance' | 'horde' | 'warcraft' | 'japan';

// Обои из файлов сайта: картинка или зацикленное видео
export type FileWallpaper = {
	// Путь к файлу без расширения: по нему выбор хранится в localStorage
	id: string;
	title: string;
	category: Category;
	kind: 'image' | 'video';
	url: string;
	// Маленькое превью для галереи (webp ~480px). Оригиналы весят мегабайты, сетка из них грузилась бы долго
	thumb: string;
	// srcset превью 240w/480w для галереи и окна сцен. Нет маленького файла — undefined
	thumbSrcSet?: string;
	// Видео: источники для <video> по порядку (AV1, H.264) — обычные и портретные для узких экранов (см. variants.ts).
	// Оригинал .mp4 в сборку не попадает, только варианты, которые делает scripts/wallpaper-variants.ts
	video?: { sources: VideoSource[]; portraitSources: VideoSource[] };
	// Картинка: <picture> с вариантами по ширине, портретными кропами и AVIF (см. variants.ts). У видео нет
	image?: ImageSources;
};

// Видео с YouTube, которое вставил посетитель. Живёт не в списке обоев, а в истории ссылок
export type YouTubeWallpaper = {
	// youtube/<videoId>
	id: string;
	title: string;
	kind: 'youtube';
	videoId: string;
	// Секунда, с которой начинать и к которой возвращаться при зацикливании
	start?: number;
	thumb: string;
};

// Файл, который посетитель загрузил сам. Лежит в IndexedDB его браузера, см. customStore.ts
export type CustomWallpaper = {
	// custom/<ключ>
	id: string;
	title: string;
	kind: 'custom';
	// Картинка или зацикленное видео
	media: 'image' | 'video';
	// Адрес object URL, действует, пока открыта страница
	url: string;
};

export type Wallpaper = FileWallpaper | CustomWallpaper | YouTubeWallpaper;

const youtubeTitle = 'Видео YouTube';

// Обои из элемента истории. Названия может не быть, пока плеер его не сообщил
export function youtubeWallpaper(item: YouTubeHistoryItem): YouTubeWallpaper {
	return {
		id: youtubeWallpaperId(item.videoId),
		title: item.title ?? youtubeTitle,
		kind: 'youtube',
		videoId: item.videoId,
		start: item.start,
		thumb: youtubeThumb(item.videoId)
	};
}

export const categories: { value: Category; label: string }[] = [
	{ value: 'alliance', label: 'Альянс' },
	{ value: 'horde', label: 'Орда' },
	{ value: 'warcraft', label: 'Warcraft' },
	{ value: 'japan', label: 'Япония' }
];

// Варианты и превью, которые сделал scripts/wallpaper-variants.ts. Ключ — путь от src/assets/wallpapers/
// (`horde/orcs-tavern.1280.avif`, `thumbs/horde/orcs-tavern.240.webp`). Как и оригиналы, файлы скачиваются, только когда их показывают
const variantUrls = Object.fromEntries(
	Object.entries(
		import.meta.glob<string>('/src/assets/wallpapers/**/*.{avif,webp}', {
			eager: true,
			query: '?url',
			import: 'default'
		})
	).map(([path, url]) => [path.replace('/src/assets/wallpapers/', ''), url])
);

// Варианты видео (`japan/cafe.av1.mp4`...): имя с лишней точкой, поэтому оригиналы шаблон не берёт и в сборку они не идут
const videoUrls = Object.fromEntries(
	Object.entries(
		import.meta.glob<string>('/src/assets/wallpapers/*/*.*.mp4', {
			eager: true,
			query: '?url',
			import: 'default'
		})
	).map(([path, url]) => [path.replace('/src/assets/wallpapers/', ''), url])
);

const thumbUrls = Object.fromEntries(
	Object.entries(variantUrls)
		.filter(([path]) => path.startsWith('thumbs/'))
		.map(([path, url]) => [path.slice('thumbs/'.length), url])
);

function withVariants(item: FileWallpaper): FileWallpaper {
	return {
		...item,
		thumbSrcSet: buildThumbSrcSet(item.id, item.thumb, thumbUrls),
		// Запасной адрес (H.264 1080p) для тех, кому нужен один файл. Нет вариантов — пусто, скрипт не запускали
		url: item.kind === 'video' ? (videoUrls[videoFile(item.id, 'h264')] ?? '') : item.url,
		video:
			item.kind === 'video'
				? {
						sources: buildVideoSources(item.id, videoUrls, false),
						portraitSources: buildVideoSources(item.id, videoUrls, true)
					}
				: undefined,
		image: item.kind === 'image' ? buildImageSources(item.id, item.url, variantUrls) : undefined
	};
}

const files: FileWallpaper[] = [
	{
		id: 'alliance/alliance-tavern',
		title: 'Таверна Альянса',
		category: 'alliance',
		kind: 'image',
		url: allianceTavern,
		thumb: allianceTavernThumb
	},
	{
		id: 'alliance/dwarfs-tavern',
		title: 'Таверна у дворфов',
		category: 'alliance',
		kind: 'image',
		url: dwarfsTavern,
		thumb: dwarfsTavernThumb
	},
	{
		id: 'alliance/elfs-tavern',
		title: 'Таверна у эльфов',
		category: 'alliance',
		kind: 'image',
		url: elfsTavern,
		thumb: elfsTavernThumb
	},
	{
		id: 'horde/orcs-tavern',
		title: 'Таверна у орков',
		category: 'horde',
		kind: 'image',
		url: orcsTavern,
		thumb: orcsTavernThumb
	},
	{
		id: 'horde/tauren-tavern',
		title: 'Таверна у тауренов',
		category: 'horde',
		kind: 'image',
		url: taurenTavern,
		thumb: taurenTavernThumb
	},
	{
		id: 'horde/bloody-elfs-tavern',
		title: 'Таверна у эльфов крови',
		category: 'horde',
		kind: 'image',
		url: bloodElfsTavern,
		thumb: bloodElfsTavernThumb
	},
	{
		id: 'warcraft/ashenvale',
		title: 'Ясеневый лес',
		category: 'warcraft',
		kind: 'video',
		url: '',
		thumb: ashenvaleThumb
	},
	{
		id: 'warcraft/booty-bay',
		title: 'Пиратская Бухта',
		category: 'warcraft',
		kind: 'video',
		url: '',
		thumb: bootyBayThumb
	},
	{
		id: 'warcraft/dragonflight',
		title: 'Драконьи острова',
		category: 'warcraft',
		kind: 'video',
		url: '',
		thumb: dragonflightThumb
	},
	{
		id: 'warcraft/mists-of-pandaria',
		title: 'Пандария',
		category: 'warcraft',
		kind: 'video',
		url: '',
		thumb: pandariaThumb
	},
	{
		id: 'warcraft/night-elf',
		title: 'Ночная эльфийка',
		category: 'warcraft',
		kind: 'video',
		url: '',
		thumb: nightElfThumb
	},
	{
		id: 'japan/cafe',
		title: 'Кофейня',
		category: 'japan',
		kind: 'video',
		url: '',
		thumb: cafeThumb
	},
	{
		id: 'japan/sakura',
		title: 'Сакура',
		category: 'japan',
		kind: 'video',
		url: '',
		thumb: sakuraThumb
	},
	{
		id: 'japan/village',
		title: 'Деревня',
		category: 'japan',
		kind: 'video',
		url: '',
		thumb: villageThumb
	}
];

export const wallpapers: FileWallpaper[] = files.map(withVariants);
