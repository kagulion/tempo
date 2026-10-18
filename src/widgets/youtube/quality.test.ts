import { describe, expect, it } from 'vitest';

import { coverScale, parseVideoQuality, qualityFrameSize, videoQualities } from './quality';

describe('qualityFrameSize', () => {
	it('«Авто» — без своего размера, iframe во весь экран', () => {
		expect(qualityFrameSize('auto')).toBeUndefined();
	});

	it('размер iframe 16:9 под потолок качества', () => {
		expect(qualityFrameSize('1080')).toEqual({ width: 1920, height: 1080 });
		expect(qualityFrameSize('720')).toEqual({ width: 1280, height: 720 });
		expect(qualityFrameSize('480')).toEqual({ width: 640, height: 360 });
	});
});

describe('coverScale', () => {
	it('закрывает экран целиком по большей стороне', () => {
		expect(coverScale({ width: 1280, height: 720 }, { width: 2560, height: 1440 })).toBe(2);
		// Узкий высокий экран телефона: растягиваем по высоте
		expect(coverScale({ width: 640, height: 360 }, { width: 375, height: 720 })).toBe(2);
		// Экран меньше iframe: уменьшаем
		expect(coverScale({ width: 1920, height: 1080 }, { width: 960, height: 400 })).toBe(0.5);
	});

	it('пустой iframe не растягивает', () => {
		expect(coverScale({ width: 0, height: 0 }, { width: 100, height: 100 })).toBe(1);
	});
});

describe('parseVideoQuality', () => {
	it('читает все варианты', () => {
		for (const quality of videoQualities) expect(parseVideoQuality(quality)).toBe(quality);
	});

	it('мусор и неизвестные варианты отбрасывает', () => {
		expect(parseVideoQuality('360')).toBeUndefined();
		expect(parseVideoQuality(720)).toBeUndefined();
		expect(parseVideoQuality(null)).toBeUndefined();
		expect(parseVideoQuality({ quality: '720' })).toBeUndefined();
	});
});
