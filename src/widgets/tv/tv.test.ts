import { describe, expect, it } from 'vitest';

import { parseTvWallpaperId, tvWallpaperId } from './tv';

describe('id телеканалов', () => {
	it('собирает и разбирает id обоев', () => {
		expect(tvWallpaperId('Channel.us@SD')).toBe('tv/Channel.us@SD');
		expect(parseTvWallpaperId('tv/Channel.us@SD')).toBe('Channel.us@SD');
	});

	it('чужие и пустые id отбрасывает', () => {
		expect(parseTvWallpaperId('tv/')).toBeUndefined();
		expect(parseTvWallpaperId('youtube/dQw4w9WgXcQ')).toBeUndefined();
		expect(parseTvWallpaperId('horde/orcs-tavern')).toBeUndefined();
		expect(parseTvWallpaperId(42)).toBeUndefined();
	});
});
