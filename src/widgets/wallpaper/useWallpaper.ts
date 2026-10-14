import { useEffect, useState } from 'react';

import { wallpapers } from './wallpapers';

const storageKey = 'tempo:wallpaper';

// Обои при первом заходе — как раньше, первые обои Орды
const defaultId = 'horde/orcs-tavern';

// Раньше сохранялись фракция и номер обоев в ней: { faction, indexes }. Переводим в id, чтобы у старых посетителей фон не сбросился
const legacyOrder: Record<string, string[]> = {
	alliance: ['alliance/alliance-tavern', 'alliance/dwarfs-tavern', 'alliance/elfs-tavern'],
	horde: ['horde/orcs-tavern', 'horde/tauren-tavern', 'horde/bloody-elfs-tavern']
};

function load(): string {
	try {
		const saved = JSON.parse(localStorage.getItem(storageKey) ?? '{}');
		let id: unknown = saved.id;
		if (id === undefined && typeof saved.faction === 'string') {
			id = legacyOrder[saved.faction]?.[saved.indexes?.[saved.faction] ?? 0];
		}
		// Список обоев мог поменяться: неизвестный id сбрасываем на обои по умолчанию
		return wallpapers.some((item) => item.id === id) ? (id as string) : defaultId;
	} catch {
		return defaultId;
	}
}

// Выбранные обои, сохраняются в localStorage
export function useWallpaper() {
	const [id, setId] = useState(load);

	useEffect(() => {
		try {
			localStorage.setItem(storageKey, JSON.stringify({ id }));
		} catch {
			// Хранилище недоступно (приватный режим) — после перезагрузки откроются обои по умолчанию
		}
	}, [id]);

	return {
		current: wallpapers.find((item) => item.id === id) ?? wallpapers[0],
		select: setId
	};
}
