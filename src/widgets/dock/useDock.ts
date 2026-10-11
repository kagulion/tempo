import { useEffect, useState, useSyncExternalStore } from 'react';

export type WidgetId = 'radio' | 'ambience' | 'timer' | 'stats' | 'wallpaper';

const storageKey = 'tempo:open-widgets';
// Первый визит: всё как было до панели, звуки закрыты
const defaultOpen: WidgetId[] = ['wallpaper', 'timer', 'radio'];

// Телефон — меньше брейкпоинта sm из Tailwind. Там помещается только одно окно
const mobileQuery = '(max-width: 639px)';

function subscribeMobile(listener: () => void) {
	const media = window.matchMedia(mobileQuery);
	media.addEventListener('change', listener);
	return () => media.removeEventListener('change', listener);
}

function isMobile() {
	return window.matchMedia(mobileQuery).matches;
}

function loadOpen(): WidgetId[] {
	try {
		const saved = localStorage.getItem(storageKey);
		return saved ? JSON.parse(saved) : defaultOpen;
	} catch {
		return defaultOpen;
	}
}

// Какие окна виджетов открыты. Порядок — по времени открытия, последнее открытое в конце
export function useDock() {
	const [open, setOpen] = useState(loadOpen);
	const mobile = useSyncExternalStore(subscribeMobile, isMobile);

	useEffect(() => {
		try {
			localStorage.setItem(storageKey, JSON.stringify(open));
		} catch {
			// Хранилище недоступно (приватный режим) — после перезагрузки откроем окна по умолчанию
		}
	}, [open]);

	// На телефоне видно только последнее открытое окно, на компьютере — все открытые
	function isOpen(id: WidgetId) {
		return mobile ? open.at(-1) === id : open.includes(id);
	}

	function toggle(id: WidgetId) {
		if (isOpen(id)) setOpen((list) => list.filter((item) => item !== id));
		// На телефоне новое окно заменяет предыдущее
		else setOpen((list) => (mobile ? [id] : [...list, id]));
	}

	return { isOpen, toggle };
}
