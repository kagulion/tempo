import { describe, expect, it } from 'vitest';

import {
	buildImageSources,
	buildThumbSrcSet,
	isVariantFile,
	landscapeSizes,
	variantFile
} from './variants';

describe('имена вариантов', () => {
	it('собирает имя и отличает вариант от оригинала', () => {
		expect(variantFile('horde/orcs-tavern', 1280, 'avif')).toBe('horde/orcs-tavern.1280.avif');
		expect(isVariantFile('orcs-tavern.1280.avif')).toBe(true);
		expect(isVariantFile('orcs-tavern.p576.webp')).toBe(true);
		expect(isVariantFile('orcs-tavern.webp')).toBe(false);
	});
});

describe('buildImageSources', () => {
	const urls = Object.fromEntries(
		[
			'1280.avif',
			'1920.avif',
			'2752.avif',
			'1280.webp',
			'1920.webp',
			'p576.avif',
			'p864.avif',
			'p576.webp',
			'p864.webp',
			'p1152.avif',
			'p1152.webp'
		].map((key) => [`h/a.${key}`, `/${key}`])
	);

	it('ставит портретные кропы раньше горизонтальных, AVIF раньше webp', () => {
		const { sources, srcSet, sizes } = buildImageSources('h/a', '/orig.webp', urls);
		expect(sources.map((s) => `${s.media ?? 'landscape'} ${s.type}`)).toEqual([
			'(max-aspect-ratio: 9/16) image/avif',
			'(max-aspect-ratio: 9/16) image/webp',
			'(orientation: portrait) image/avif',
			'(orientation: portrait) image/webp',
			'landscape image/avif'
		]);
		expect(sources[0].srcSet).toBe('/p576.avif 576w, /p864.avif 864w');
		expect(sources[4].srcSet).toBe('/1280.avif 1280w, /1920.avif 1920w, /2752.avif 2752w');
		// Запасной webp — это <img>: оригинал замыкает srcset
		expect(srcSet).toBe('/1280.webp 1280w, /1920.webp 1920w, /orig.webp 2752w');
		expect(sizes).toBe(landscapeSizes);
	});

	it('без вариантов остаётся один оригинал', () => {
		const { sources, srcSet } = buildImageSources('h/a', '/orig.webp', {});
		expect(sources).toEqual([]);
		expect(srcSet).toBe('/orig.webp 2752w');
	});

	it('sizes для object-cover учитывает высоту экрана', () => {
		expect(landscapeSizes).toBe('max(100vw, 179.2vh)');
	});
});

describe('buildThumbSrcSet', () => {
	it('240w и 480w, а без маленького файла — ничего', () => {
		expect(buildThumbSrcSet('h/a', '/t480.webp', { 'h/a.240.webp': '/t240.webp' })).toBe(
			'/t240.webp 240w, /t480.webp 480w'
		);
		expect(buildThumbSrcSet('h/a', '/t480.webp', {})).toBeUndefined();
	});
});
