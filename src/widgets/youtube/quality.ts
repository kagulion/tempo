// Качество видео YouTube-фона. Чистый модуль без React: его легко тестировать.
//
// Прямо задать качество нельзя: setPlaybackQuality и параметр vq плеер YouTube давно не слушает.
// Качество он выбирает сам, по скорости сети и размеру iframe: на iframe 1280×720 выше 720p не поднимается.
// Поэтому выбор работает как потолок: iframe делаем нужного размера и растягиваем на экран через transform
// (масштаб на выбор плеера не влияет). Ниже 480p так не опустить: на любом маленьком iframe плеер берёт 480p

export const videoQualities = ['auto', '1080', '720', '480'] as const;

export type VideoQuality = (typeof videoQualities)[number];

export const defaultVideoQuality: VideoQuality = 'auto';

export const videoQualityLabels: Record<VideoQuality, string> = {
	auto: 'Авто',
	'1080': '1080p',
	'720': '720p',
	'480': '480p'
};

// Высота iframe, на которой плеер не поднимается выше нужного качества. Для 480p — 360: при 480 он уже берёт 720p
const frameHeights: Record<Exclude<VideoQuality, 'auto'>, number> = {
	'1080': 1080,
	'720': 720,
	'480': 360
};

export type FrameSize = { width: number; height: number };

// Размер iframe в CSS-пикселях. Плотность экрана плеер не учитывает (проверено при devicePixelRatio 2:
// 640×360 всё так же даёт 480p), поэтому на неё не делим. undefined — «Авто»: iframe просто во весь экран
export function qualityFrameSize(quality: VideoQuality): FrameSize | undefined {
	if (quality === 'auto') return undefined;
	const height = frameHeights[quality];
	return { width: Math.round((height * 16) / 9), height };
}

// Во сколько раз растянуть iframe, чтобы он закрыл экран целиком, как object-cover
export function coverScale(frame: FrameSize, viewport: FrameSize) {
	if (frame.width <= 0 || frame.height <= 0) return 1;
	return Math.max(viewport.width / frame.width, viewport.height / frame.height);
}

// Сохранённое качество. Неизвестное значение (мусор или вариант, который убрали) отбрасываем
export function parseVideoQuality(saved: unknown): VideoQuality | undefined {
	return videoQualities.find((quality) => quality === saved);
}
