import { describe, expect, it } from 'vitest';

import { audibleLevel } from './soundMute';

describe('audibleLevel', () => {
	it('без режима «без звука» отдаёт приглушение таймера как есть', () => {
		expect(audibleLevel(1, false)).toBe(1);
		expect(audibleLevel(0.4, false)).toBe(0.4);
	});

	it('в режиме «без звука» всегда тишина, что бы ни делал таймер', () => {
		expect(audibleLevel(1, true)).toBe(0);
		expect(audibleLevel(0.4, true)).toBe(0);
	});
});
