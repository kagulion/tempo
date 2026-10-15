import { describe, expect, it } from 'vitest';

import { focusVisibility } from './focus';

describe('focusVisibility', () => {
	it('в обычном режиме всё видно, часы — по настройке', () => {
		expect(focusVisibility('off')).toEqual({ windows: true, dock: true, bigClock: 'user' });
	});

	it('в режиме «всё скрыто» убирает окна, панели и часы', () => {
		expect(focusVisibility('all')).toEqual({ windows: false, dock: false, bigClock: 'hide' });
	});

	it('в режиме «только часы» убирает окна и панели, часы показывает всегда', () => {
		expect(focusVisibility('clock')).toEqual({ windows: false, dock: false, bigClock: 'force' });
	});
});
