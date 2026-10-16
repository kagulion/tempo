// Свои обои посетителя: чистая логика (id, проверка файла). Сам файл лежит в IndexedDB, см. customStore.ts

// Не больше стольких своих обоев: файлы живут в браузере и занимают место
export const maxCustomWallpapers = 8;

const megabyte = 1024 * 1024;
export const maxImageSize = 50 * megabyte;
export const maxVideoSize = 250 * megabyte;

export type CustomMedia = 'image' | 'video';

// Расширения нужны, когда система не сообщила тип файла (бывает на Windows с avif и webm)
const mimeTypes: Record<string, { media: CustomMedia; extensions: string[] }> = {
	'image/jpeg': { media: 'image', extensions: ['jpg', 'jpeg'] },
	'image/png': { media: 'image', extensions: ['png'] },
	'image/webp': { media: 'image', extensions: ['webp'] },
	'image/gif': { media: 'image', extensions: ['gif'] },
	'image/avif': { media: 'image', extensions: ['avif'] },
	'video/mp4': { media: 'video', extensions: ['mp4'] },
	'video/webm': { media: 'video', extensions: ['webm'] }
};

// Для атрибута accept у поля выбора файла
export const customAccept = [
	...Object.keys(mimeTypes),
	...Object.values(mimeTypes).flatMap((item) => item.extensions.map((ext) => `.${ext}`))
].join(',');

const idPattern = /^custom\/([a-z0-9]{4,32})$/;

export function customWallpaperId(key: string): string {
	return `custom/${key}`;
}

// Ключ из custom/<ключ>; undefined, если строка не такой формы
export function parseCustomWallpaperId(id: unknown): string | undefined {
	if (typeof id !== 'string') return undefined;
	return idPattern.exec(id)?.[1];
}

// Новый уникальный ключ: время + случайный хвост
export function newCustomKey(now: number = Date.now(), random: number = Math.random()): string {
	return (
		now.toString(36) +
		Math.floor(random * 36 ** 4)
			.toString(36)
			.padStart(4, '0')
	);
}

function extensionOf(name: string): string {
	const dot = name.lastIndexOf('.');
	return dot === -1 ? '' : name.slice(dot + 1).toLowerCase();
}

// Тип файла по MIME, а если его нет — по расширению
export function detectMedia(file: { type: string; name: string }): CustomMedia | undefined {
	const byMime = mimeTypes[file.type.toLowerCase()];
	if (byMime) return byMime.media;
	if (file.type !== '') return undefined;
	const ext = extensionOf(file.name);
	return Object.values(mimeTypes).find((item) => item.extensions.includes(ext))?.media;
}

export type FileCheck = { ok: true; media: CustomMedia } | { ok: false; message: string };

function formatSize(bytes: number): string {
	return `${Math.round(bytes / megabyte)} МБ`;
}

export function checkFile(file: { type: string; name: string; size: number }): FileCheck {
	const media = detectMedia(file);
	if (media === undefined) {
		return {
			ok: false,
			message: 'Подходит картинка (JPG, PNG, WebP, GIF, AVIF) или видео (MP4, WebM)'
		};
	}
	if (file.size === 0) return { ok: false, message: 'Файл пустой' };
	const limit = media === 'image' ? maxImageSize : maxVideoSize;
	if (file.size > limit) {
		return {
			ok: false,
			message: `Файл слишком большой: ${formatSize(file.size)}. Для ${media === 'image' ? 'картинки' : 'видео'} — не больше ${formatSize(limit)}`
		};
	}
	return { ok: true, media };
}

const maxTitleLength = 40;

// Название плитки из имени файла: без расширения и длинных хвостов
export function customTitle(name: string, media: CustomMedia): string {
	const dot = name.lastIndexOf('.');
	const base = (dot > 0 ? name.slice(0, dot) : name).replace(/\s+/g, ' ').trim();
	if (base === '') return media === 'image' ? 'Своя картинка' : 'Своё видео';
	return base.length > maxTitleLength ? `${base.slice(0, maxTitleLength - 1)}…` : base;
}
