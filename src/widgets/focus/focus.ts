// Режим фокуса: 'off' — всё как обычно, 'all' — скрыто всё, 'clock' — остаются только крупные часы
export type FocusMode = 'off' | 'all' | 'clock';

// Что показывать в режиме. bigClock: 'user' — по настройке пользователя, 'force' — всегда, 'hide' — скрыть
export type FocusVisibility = {
	windows: boolean;
	dock: boolean;
	bigClock: 'user' | 'force' | 'hide';
};

export function focusVisibility(mode: FocusMode): FocusVisibility {
	switch (mode) {
		case 'off':
			return { windows: true, dock: true, bigClock: 'user' };
		case 'all':
			return { windows: false, dock: false, bigClock: 'hide' };
		case 'clock':
			return { windows: false, dock: false, bigClock: 'force' };
	}
}
