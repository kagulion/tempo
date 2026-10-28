// Статичные картинки видео на i.ytimg.com

// maxresdefault есть не у всякого видео; 1, 2, 3 — кадры, которые YouTube выбирает сам (120x90),
// hq1, hq2, hq3 — те же кадры покрупнее (480x360), но есть не у каждого видео
export type YouTubeThumbVariant =
	'maxresdefault' | 'hqdefault' | 'hq1' | 'hq2' | 'hq3' | '1' | '2' | '3';

// Превью видео. По умолчанию hqdefault: он есть у любого видео
export function youtubeThumb(videoId: string, variant: YouTubeThumbVariant = 'hqdefault') {
	return `https://i.ytimg.com/vi/${videoId}/${variant}.jpg`;
}
