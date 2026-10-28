import { describe, expect, it } from 'vitest';

import { youtubeThumb } from './thumbs';

const id = 'dQw4w9WgXcQ';

describe('youtubeThumb', () => {
	it('по умолчанию даёт hqdefault', () => {
		expect(youtubeThumb(id)).toBe(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`);
	});

	it.each(['maxresdefault', 'hqdefault', 'hq1', 'hq2', 'hq3', '1', '2', '3'] as const)(
		'даёт вариант %s',
		(variant) => {
			expect(youtubeThumb(id, variant)).toBe(`https://i.ytimg.com/vi/${id}/${variant}.jpg`);
		}
	);
});
