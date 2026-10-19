import { describe, expect, it } from 'vitest';

import { openWindow } from './useDock';

describe('openWindow', () => {
	it('на узком экране новое окно заменяет все открытые', () => {
		expect(openWindow(['wallpaper', 'timer', 'radio'], 'tasks', true)).toEqual(['tasks']);
	});

	it('на широком экране закрывает только соседей по месту', () => {
		expect(openWindow(['wallpaper', 'timer', 'radio'], 'stats', false)).toEqual([
			'wallpaper',
			'radio',
			'stats'
		]);
		expect(openWindow(['radio'], 'tasks', false)).toEqual(['radio', 'tasks']);
	});
});
