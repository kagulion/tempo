import { toStart, videoIdPattern, type YouTubeVideo } from '@/lib/youtube/links';
import type { YouTubeThumbVariant } from '@/lib/youtube/thumbs';

// Коллекция пластинок проигрывателя. Чистый модуль без React: его легко тестировать

// Вид пластинки: чёрный винил с наклейкой, компакт-диск. Один на все пластинки (настройка проигрывателя)
export type DiscStyle = 'vinyl' | 'cd';
// Что на картинке: обложка видео или один из трёх кадров, которые YouTube выбрал сам
export type DiscImage = 'cover' | 'frame1' | 'frame2' | 'frame3';

export const discStyles: readonly DiscStyle[] = ['vinyl', 'cd'];
export const discImages: readonly DiscImage[] = ['cover', 'frame1', 'frame2', 'frame3'];

export const discStyleLabels: Record<DiscStyle, string> = {
	vinyl: 'Винил',
	cd: 'CD'
};

export const discImageLabels: Record<DiscImage, string> = {
	cover: 'Обложка',
	frame1: 'Кадр 1',
	frame2: 'Кадр 2',
	frame3: 'Кадр 3'
};

export type Disc = {
	// Совпадает с videoId: одно видео — одна пластинка
	id: string;
	videoId: string;
	title?: string;
	image: DiscImage;
	// Секунда, с которой начинать, если запомненного места ещё нет (из ссылки с ?t=)
	start?: number;
	// Где остановились, в секундах
	position?: number;
};

// Сколько пластинок помнит коллекция
export const discLimit = 50;

export const defaultStyle: DiscStyle = 'vinyl';
export const defaultImage: DiscImage = 'cover';

function isOneOf<T extends string>(list: readonly T[], value: unknown): value is T {
	return typeof value === 'string' && (list as readonly string[]).includes(value);
}

// Новая пластинка — наверх. Повторное добавление того же видео поднимает её, не трогая настройки и место.
// Название берём новое, если оно есть: иначе остаётся прежнее
export function addDisc(
	list: Disc[],
	video: YouTubeVideo & { title?: string },
	max = discLimit
): Disc[] {
	const previous = list.find((disc) => disc.id === video.videoId);
	const disc: Disc = previous
		? { ...previous }
		: { id: video.videoId, videoId: video.videoId, image: defaultImage };
	if (video.title) disc.title = video.title;
	if (video.start !== undefined) disc.start = video.start;
	return [disc, ...list.filter((item) => item.id !== video.videoId)].slice(0, max);
}

export function removeDisc(list: Disc[], id: string) {
	return list.filter((disc) => disc.id !== id);
}

// Меняет поля пластинки. Если ничего не изменилось или пластинки нет, возвращает тот же список
export function updateDisc(
	list: Disc[],
	id: string,
	patch: Partial<Pick<Disc, 'image' | 'title' | 'position'>>
): Disc[] {
	const index = list.findIndex((disc) => disc.id === id);
	if (index === -1) return list;
	const current = list[index];
	// Место 0 и отсутствие места — одно и то же: на старте плеер сообщает 0, писать это в хранилище незачем
	const changed = (Object.keys(patch) as (keyof typeof patch)[]).some((key) =>
		key === 'position'
			? (patch.position ?? 0) !== (current.position ?? 0)
			: patch[key] !== current[key]
	);
	if (!changed) return list;
	return list.map((disc, i) => (i === index ? { ...disc, ...patch } : disc));
}

// Соседняя пластинка по порядку списка. С wrap после последней идёт первая, перед первой — последняя.
// Без wrap за краем списка — undefined. Если текущей нет в списке, начинаем с края
export function neighbourDisc(
	list: Disc[],
	currentId: string | undefined,
	step: 1 | -1,
	wrap = true
): Disc | undefined {
	if (list.length === 0) return undefined;
	const index = list.findIndex((disc) => disc.id === currentId);
	if (index === -1) return step === 1 ? list[0] : list[list.length - 1];
	const next = index + step;
	if (next >= 0 && next < list.length) return list[next];
	return wrap ? list[(next + list.length) % list.length] : undefined;
}

// Кадры «1, 2, 3» у YouTube мелкие (120x90), а hq1..hq3 крупнее, но есть не у каждого видео.
// Поэтому у картинки цепочка вариантов: берём первый, который загрузился
export function imageVariants(image: DiscImage): YouTubeThumbVariant[] {
	switch (image) {
		case 'cover':
			return ['maxresdefault', 'hqdefault'];
		case 'frame1':
			return ['hq1', '1', 'hqdefault'];
		case 'frame2':
			return ['hq2', '2', 'hqdefault'];
		case 'frame3':
			return ['hq3', '3', 'hqdefault'];
	}
}

// Какой вариант показать в меню выбора картинки: сразу крупный и точно существующий для обложки
export function previewVariant(image: DiscImage): YouTubeThumbVariant {
	return image === 'cover' ? 'hqdefault' : imageVariants(image)[0];
}

// У всех вариантов, кроме maxresdefault, картинка 4:3 с чёрными полосами сверху и снизу
export function isLetterboxed(variant: YouTubeThumbVariant) {
	return variant !== 'maxresdefault';
}

// Крошечные кадры «1, 2, 3» настоящие 120x90, а hqdefault есть у любого видео и последний в цепочке:
// у остальных такой размер означает серую заглушку YouTube
export function isPlaceholderSize(variant: YouTubeThumbVariant, naturalWidth: number) {
	return naturalWidth <= 120 && !['1', '2', '3', 'hqdefault'].includes(variant);
}

// Проверка сохранённой коллекции: плохие элементы отбрасываем, остальные остаются
export function parseCollection(saved: unknown): Disc[] | undefined {
	if (!Array.isArray(saved)) return undefined;

	const result: Disc[] = [];
	for (const entry of saved) {
		if (typeof entry !== 'object' || entry === null) continue;
		const { videoId, title, image, start, position } = entry as Record<string, unknown>;
		if (typeof videoId !== 'string' || !videoIdPattern.test(videoId)) continue;
		if (result.some((disc) => disc.id === videoId)) continue;

		const disc: Disc = {
			id: videoId,
			videoId,
			image: isOneOf(discImages, image) ? image : defaultImage
		};
		if (typeof title === 'string' && title.trim() !== '') disc.title = title;
		if (typeof start === 'number' && toStart(start) !== undefined) disc.start = start;
		if (typeof position === 'number' && Number.isFinite(position) && position > 0) {
			disc.position = position;
		}
		result.push(disc);
	}
	return result.slice(0, discLimit);
}
