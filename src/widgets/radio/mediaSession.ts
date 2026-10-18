// Системный плеер (Media Session API): название, исполнитель и обложка на экране блокировки,
// в медиаклавишах и уведомлении браузера

export const defaultArtist = 'Радио Рекорд';

export type MediaInfo = {
	title: string;
	artist: string;
	album: string;
	artwork: { src: string }[];
};

type StationInfo = { title: string; icon?: string };
type TrackInfo = { artist: string; song: string; cover?: string };

// Что показать в системном плеере: песня и исполнитель, а без трека — станция и «Радио Рекорд».
// Обложка — трека, иначе иконка станции
export function mediaInfo(station: StationInfo, track?: TrackInfo): MediaInfo {
	const stationTitle = station.title.trim() || 'Без названия';
	const art = track?.cover ?? station.icon;
	return {
		title: track?.song.trim() || stationTitle,
		artist: track?.artist.trim() || defaultArtist,
		album: stationTitle,
		artwork: art ? [{ src: art }] : []
	};
}

// info = null — убрать метаданные (радио выключено). Без поддержки API ничего не делает
export function applyMediaInfo(info: MediaInfo | null) {
	if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
	try {
		navigator.mediaSession.metadata =
			info && typeof MediaMetadata !== 'undefined' ? new MediaMetadata(info) : null;
	} catch {
		// Метаданные не обязательны
	}
}
