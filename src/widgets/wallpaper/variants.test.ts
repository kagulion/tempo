import { describe, expect, it } from 'vitest';

import {
	buildImageSources,
	buildThumbSrcSet,
	buildVideoSources,
	isVariantFile,
	landscapeSizes,
	variantFile,
	videoFile
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

describe('buildVideoSources', () => {
	const urls = {
		'w/a.av1.mp4': '/av1',
		'w/a.h264.mp4': '/h264',
		'w/a.p.av1.mp4': '/p-av1',
		'w/a.p.h264.mp4': '/p-h264'
	};

	it('AV1 раньше H.264, а портретные идут первыми только для узких экранов', () => {
		expect(buildVideoSources('w/a', urls, false).map((s) => s.src)).toEqual(['/av1', '/h264']);
		expect(buildVideoSources('w/a', urls, true).map((s) => s.src)).toEqual([
			'/p-av1',
			'/p-h264',
			'/av1',
			'/h264'
		]);
	});

	it('точные строки кодеков в type', () => {
		const [av1, h264] = buildVideoSources('w/a', urls, false);
		expect(av1.type).toBe('video/mp4; codecs="av01.0.08M.10"');
		expect(h264.type).toBe('video/mp4; codecs="avc1.640028"');
	});

	it('без вариантов источников нет', () => {
		expect(buildVideoSources('w/a', {}, true)).toEqual([]);
		expect(videoFile('w/a', 'av1', true)).toBe('w/a.p.av1.mp4');
	});
});
