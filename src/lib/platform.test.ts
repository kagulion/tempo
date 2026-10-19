import { describe, expect, it } from 'vitest';

import { isIosWebKit } from './platform';

const iphone =
	'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const iphoneChrome =
	'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0 Mobile/15E148 Safari/604.1';
const mac =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
const android =
	'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36';

describe('isIosWebKit', () => {
	it('узнаёт iPhone, в том числе Chrome на нём', () => {
		expect(isIosWebKit({ userAgent: iphone, maxTouchPoints: 5 })).toBe(true);
		expect(isIosWebKit({ userAgent: iphoneChrome, maxTouchPoints: 5 })).toBe(true);
	});

	it('узнаёт iPad, который назвался Macintosh', () => {
		expect(isIosWebKit({ userAgent: mac, maxTouchPoints: 5 })).toBe(true);
	});

	it('не путает Mac без тача и Android', () => {
		expect(isIosWebKit({ userAgent: mac, maxTouchPoints: 0 })).toBe(false);
		expect(isIosWebKit({ userAgent: android, maxTouchPoints: 5 })).toBe(false);
	});
});
