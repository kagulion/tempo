import allianceTavern from '@/assets/wallpapers/alliance/alliance-tavern.webp';
import dwarfsTavern from '@/assets/wallpapers/alliance/dwarfs-tavern.webp';
import elfsTavern from '@/assets/wallpapers/alliance/elfs-tavern.webp';
import bloodElfsTavern from '@/assets/wallpapers/horde/bloody-elfs-tavern.webp';
import orcsTavern from '@/assets/wallpapers/horde/orcs-tavern.webp';
import taurenTavern from '@/assets/wallpapers/horde/tauren-tavern.webp';
import cafe from '@/assets/wallpapers/japan/cafe.mp4';
import sakura from '@/assets/wallpapers/japan/sakura.mp4';
import village from '@/assets/wallpapers/japan/village.mp4';
import allianceTavernThumb from '@/assets/wallpapers/thumbs/alliance/alliance-tavern.webp';
import dwarfsTavernThumb from '@/assets/wallpapers/thumbs/alliance/dwarfs-tavern.webp';
import elfsTavernThumb from '@/assets/wallpapers/thumbs/alliance/elfs-tavern.webp';
import bloodElfsTavernThumb from '@/assets/wallpapers/thumbs/horde/bloody-elfs-tavern.webp';
import orcsTavernThumb from '@/assets/wallpapers/thumbs/horde/orcs-tavern.webp';
import taurenTavernThumb from '@/assets/wallpapers/thumbs/horde/tauren-tavern.webp';
import cafeThumb from '@/assets/wallpapers/thumbs/japan/cafe.webp';
import sakuraThumb from '@/assets/wallpapers/thumbs/japan/sakura.webp';
import villageThumb from '@/assets/wallpapers/thumbs/japan/village.webp';
import ashenvaleThumb from '@/assets/wallpapers/thumbs/warcraft/ashenvale.webp';
import bootyBayThumb from '@/assets/wallpapers/thumbs/warcraft/booty-bay.webp';
import dragonflightThumb from '@/assets/wallpapers/thumbs/warcraft/dragonflight.webp';
import pandariaThumb from '@/assets/wallpapers/thumbs/warcraft/mists-of-pandaria.webp';
import nightElfThumb from '@/assets/wallpapers/thumbs/warcraft/night-elf.webp';
import ashenvale from '@/assets/wallpapers/warcraft/ashenvale.mp4';
import bootyBay from '@/assets/wallpapers/warcraft/booty-bay.mp4';
import dragonflight from '@/assets/wallpapers/warcraft/dragonflight.mp4';
import pandaria from '@/assets/wallpapers/warcraft/mists-of-pandaria.mp4';
import nightElf from '@/assets/wallpapers/warcraft/night-elf.mp4';

import { tvWallpaperId } from '@/widgets/tv/tv';
import type { TvChannel } from '@/widgets/tv/channels';
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

// Телеканал из списка ТВ: поток HLS. Как и YouTube, живёт не в списке обоев
export type TvWallpaper = {
	// tv/<id канала>
	id: string;
	title: string;
	kind: 'tv';
	// Ссылка на плейлист HLS
	url: string;
};

export type Wallpaper = FileWallpaper | YouTubeWallpaper | TvWallpaper;

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

export function tvWallpaper(channel: TvChannel): TvWallpaper {
	return {
		id: tvWallpaperId(channel.id),
		title: channel.title,
		kind: 'tv',
		url: channel.url
	};
}

export const categories: { value: Category; label: string }[] = [
	{ value: 'alliance', label: 'Альянс' },
	{ value: 'horde', label: 'Орда' },
	{ value: 'warcraft', label: 'Warcraft' },
	{ value: 'japan', label: 'Япония' }
];

export const wallpapers: FileWallpaper[] = [
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
		url: ashenvale,
		thumb: ashenvaleThumb
	},
	{
		id: 'warcraft/booty-bay',
		title: 'Пиратская Бухта',
		category: 'warcraft',
		kind: 'video',
		url: bootyBay,
		thumb: bootyBayThumb
	},
	{
		id: 'warcraft/dragonflight',
		title: 'Драконьи острова',
		category: 'warcraft',
		kind: 'video',
		url: dragonflight,
		thumb: dragonflightThumb
	},
	{
		id: 'warcraft/mists-of-pandaria',
		title: 'Пандария',
		category: 'warcraft',
		kind: 'video',
		url: pandaria,
		thumb: pandariaThumb
	},
	{
		id: 'warcraft/night-elf',
		title: 'Ночная эльфийка',
		category: 'warcraft',
		kind: 'video',
		url: nightElf,
		thumb: nightElfThumb
	},
	{
		id: 'japan/cafe',
		title: 'Кофейня',
		category: 'japan',
		kind: 'video',
		url: cafe,
		thumb: cafeThumb
	},
	{
		id: 'japan/sakura',
		title: 'Сакура',
		category: 'japan',
		kind: 'video',
		url: sakura,
		thumb: sakuraThumb
	},
	{
		id: 'japan/village',
		title: 'Деревня',
		category: 'japan',
		kind: 'video',
		url: village,
		thumb: villageThumb
	}
];
