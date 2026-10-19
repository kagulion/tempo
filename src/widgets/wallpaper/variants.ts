// Варианты файловых обоев-картинок: размеры, имена и сборка srcset для <picture>. Без React и без Vite.
// Файлы делает scripts/wallpaper-variants.ts (pnpm wallpaper:variants), а это общий для скрипта и приложения
// договор об именах: варианты лежат рядом с оригиналом `<имя>.webp`, имя варианта — `<имя>.<ключ>.<формат>`

// Оригиналы обоев: 2752×1536. Скрипт проверяет размер
export const fullWidth = 2752;
export const fullHeight = 1536;

export type ImageFormat = 'avif' | 'webp';

// Порядок важен: браузер берёт первый <source>, который понимает. AVIF легче webp в 2–3 раза
export const formats: ImageFormat[] = ['avif', 'webp'];

export const mimeTypes: Record<ImageFormat, string> = { avif: 'image/avif', webp: 'image/webp' };

// Горизонтальные варианты по ширине. Оригинал (fullWidth) лежит как `<имя>.webp`, его AVIF — `<имя>.2752.avif`
export const landscapeWidths = [1280, 1920];

// Портретные кропы по центру. object-cover на портретном экране показывает только центральную полосу картинки,
// и скачивать всю ширину незачем. Кроп считается от высоты оригинала, поэтому виден ровно тот же участок, что и без кропа:
// - narrow (9:16) — узкие телефоны, экран не шире 9/16;
// - wide (3:4) — остальные портретные экраны (планшеты и телефоны пошире)
export type PortraitCrop = {
	key: 'narrow' | 'wide';
	// Ширина кропа к высоте оригинала
	aspect: number;
	// Ширины готовых файлов в пикселях
	widths: number[];
	// Для каких экранов кроп годится (media у <source>)
	media: string;
	// Ширина картинки при object-cover на высоту экрана, в vh: высота экрана × aspect
	vhWidth: number;
};

export const portraitCrops: PortraitCrop[] = [
	{
		key: 'narrow',
		aspect: 9 / 16,
		widths: [576, 864],
		media: '(max-aspect-ratio: 9/16)',
		vhWidth: 56.25
	},
	{ key: 'wide', aspect: 3 / 4, widths: [1152], media: '(orientation: portrait)', vhWidth: 75 }
];

// Ключ файла портретного варианта: p576
export function portraitKey(width: number) {
	return `p${width}`;
}

// Превью для галереи и окна сцен. 480 — существующие файлы `thumbs/<категория>/<имя>.webp`, 240 делает скрипт
export const thumbWidth = 480;
export const thumbSmallWidth = 240;

// Имя варианта: orcs-tavern + 1280 + avif → orcs-tavern.1280.avif
export function variantFile(base: string, key: string | number, format: ImageFormat) {
	return `${base}.${key}.${format}`;
}

// Оригинал или вариант? У оригинала в имени без расширения нет точек
export function isVariantFile(file: string) {
	return file.replace(/\.[^.]+$/, '').includes('.');
}

// Ширина картинки при object-cover на весь экран: max(100vw, 100vh × пропорции картинки).
// По ней, а не по 100vw, браузер выбирает файл из srcset
export const landscapeSizes = `max(100vw, ${((100 * fullWidth) / fullHeight).toFixed(1)}vh)`;

export function portraitSizes(crop: PortraitCrop) {
	return `max(100vw, ${crop.vhWidth}vh)`;
}

export type ImageSource = {
	type: string;
	media?: string;
	srcSet: string;
	sizes: string;
};

// Описание <picture>: источники по порядку и запасной <img>
export type ImageSources = {
	sources: ImageSource[];
	srcSet: string;
	sizes: string;
};

function srcSetOf(entries: [string | undefined, number][]) {
	return entries
		.filter((entry): entry is [string, number] => Boolean(entry[0]))
		.map(([url, width]) => `${url} ${width}w`)
		.join(', ');
}

// Собирает источники из готовых URL. urls — адреса вариантов по имени файла, original — адрес оригинала.
// Каких-то вариантов нет (обои добавили, а скрипт не запускали) — берём то, что есть, в крайнем случае остаётся оригинал
export function buildImageSources(
	base: string,
	original: string,
	urls: Record<string, string>
): ImageSources {
	const sources: ImageSource[] = [];
	const find = (key: string | number, format: ImageFormat) => urls[variantFile(base, key, format)];

	for (const crop of portraitCrops) {
		for (const format of formats) {
			const srcSet = srcSetOf(
				crop.widths.map((width) => [find(portraitKey(width), format), width])
			);
			if (srcSet) {
				sources.push({
					type: mimeTypes[format],
					media: crop.media,
					srcSet,
					sizes: portraitSizes(crop)
				});
			}
		}
	}

	const avif = srcSetOf([
		...landscapeWidths.map((width): [string | undefined, number] => [find(width, 'avif'), width]),
		[find(fullWidth, 'avif'), fullWidth]
	]);
	if (avif) sources.push({ type: mimeTypes.avif, srcSet: avif, sizes: landscapeSizes });

	const webp = srcSetOf([
		...landscapeWidths.map((width): [string | undefined, number] => [find(width, 'webp'), width]),
		[original, fullWidth]
	]);
	return { sources, srcSet: webp, sizes: landscapeSizes };
}

// srcset превью: 240w и 480w. Маленького нет — undefined, останется одно большое
export function buildThumbSrcSet(base: string, thumb: string, urls: Record<string, string>) {
	const small = urls[variantFile(base, thumbSmallWidth, 'webp')];
	return small ? `${small} ${thumbSmallWidth}w, ${thumb} ${thumbWidth}w` : undefined;
}
