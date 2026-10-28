// Статичные картинки видео на i.ytimg.com

// maxresdefault есть не у всякого видео; 1, 2, 3 — кадры, которые YouTube выбирает сам (120x90)
export type YouTubeThumbVariant = 'maxresdefault' | 'hqdefault' | '1' | '2' | '3';

// Превью видео. По умолчанию hqdefault: он есть у любого видео
export function youtubeThumb(videoId: string, variant: YouTubeThumbVariant = 'hqdefault') {
	return `https://i.ytimg.com/vi/${videoId}/${variant}.jpg`;
}
