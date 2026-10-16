import { describe, expect, it } from 'vitest';

import {
	checkFile,
	customTitle,
	customWallpaperId,
	detectMedia,
	maxImageSize,
	maxVideoSize,
	newCustomKey,
	parseCustomWallpaperId
} from './custom';
import { parseSaved } from './useWallpaper';

describe('parseCustomWallpaperId', () => {
	it('достаёт ключ из custom/<ключ>', () => {
		expect(parseCustomWallpaperId('custom/abc123')).toBe('abc123');
		expect(parseCustomWallpaperId(customWallpaperId(newCustomKey()))).toBeDefined();
	});

	it.each([
		'custom/',
		'custom/ab',
		'custom/AB12CD',
		'custom/a/b',
		'horde/orcs',
		'xcustom/abcd',
		42,
		null
	])('отвергает %j', (value) => {
		expect(parseCustomWallpaperId(value)).toBeUndefined();
	});
});

describe('newCustomKey', () => {
	it('даёт ключ допустимой формы и разный для разных вызовов', () => {
		const a = newCustomKey(1_700_000_000_000, 0.1);
		const b = newCustomKey(1_700_000_000_000, 0.9);
		expect(parseCustomWallpaperId(customWallpaperId(a))).toBe(a);
		expect(a).not.toBe(b);
	});
});

describe('detectMedia / checkFile', () => {
	it('узнаёт тип по MIME', () => {
		expect(detectMedia({ type: 'image/avif', name: 'a' })).toBe('image');
		expect(detectMedia({ type: 'video/webm', name: 'a' })).toBe('video');
		expect(detectMedia({ type: 'application/pdf', name: 'a.png' })).toBeUndefined();
	});

	it('без MIME смотрит на расширение', () => {
		expect(detectMedia({ type: '', name: 'Clip.MP4' })).toBe('video');
		expect(detectMedia({ type: '', name: 'notes.txt' })).toBeUndefined();
	});

	it('принимает подходящий файл', () => {
		expect(checkFile({ type: 'image/png', name: 'a.png', size: 1000 })).toEqual({
			ok: true,
			media: 'image'
		});
	});

	it('отвергает чужой тип, пустой и слишком большой файл с понятной ошибкой', () => {
		expect(checkFile({ type: 'text/plain', name: 'a.txt', size: 10 }).ok).toBe(false);
		expect(checkFile({ type: 'image/png', name: 'a.png', size: 0 }).ok).toBe(false);
		const big = checkFile({ type: 'image/jpeg', name: 'a.jpg', size: maxImageSize + 1 });
		expect(big.ok).toBe(false);
		if (!big.ok) expect(big.message).toContain('слишком большой');
		expect(checkFile({ type: 'video/mp4', name: 'a.mp4', size: maxImageSize + 1 }).ok).toBe(true);
		expect(checkFile({ type: 'video/mp4', name: 'a.mp4', size: maxVideoSize + 1 }).ok).toBe(false);
	});
});

describe('customTitle', () => {
	it('убирает расширение и обрезает длинное имя', () => {
		expect(customTitle('Мой  фон.final.jpg', 'image')).toBe('Мой фон.final');
		expect(customTitle('x'.repeat(100) + '.mp4', 'video')).toHaveLength(40);
		expect(customTitle('.png', 'image')).toBe('.png');
	});

	it('для пустого имени берёт название по умолчанию', () => {
		expect(customTitle('', 'video')).toBe('Своё видео');
		expect(customTitle('  ', 'image')).toBe('Своя картинка');
	});
});

describe('parseSaved со своими обоями', () => {
	it('принимает id по форме custom/<ключ>', () => {
		expect(parseSaved({ id: 'custom/abc123' })).toEqual({ id: 'custom/abc123' });
	});

	it('отвергает испорченные custom id', () => {
		expect(parseSaved({ id: 'custom/' })).toBeUndefined();
		expect(parseSaved({ id: 'custom/../x' })).toBeUndefined();
	});
});
