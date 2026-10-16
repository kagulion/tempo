import { useSyncExternalStore } from 'react';

import {
	checkFile,
	customTitle,
	customWallpaperId,
	maxCustomWallpapers,
	newCustomKey
} from './custom';
import { deleteRecord, loadRecords, saveRecord } from './customStore';
import type { CustomWallpaper } from './wallpapers';

// Свои обои посетителя в памяти страницы. Файлы лежат в IndexedDB, здесь — их object URL.
// URL живёт, пока обои в списке, и освобождается при удалении

export type CustomItem = {
	wallpaper: CustomWallpaper;
	// Файл записан в IndexedDB. false — хранилище недоступно, обои исчезнут после перезагрузки
	saved: boolean;
	createdAt: number;
};

export type CustomState = {
	// Список прочитан из IndexedDB (или чтение не удалось)
	loaded: boolean;
	items: CustomItem[];
};

let state: CustomState = { loaded: false, items: [] };
const listeners = new Set<() => void>();

function setState(next: CustomState) {
	state = next;
	listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

let loading: Promise<void> | undefined;

// Читает сохранённые обои один раз
export function loadCustomWallpapers(): Promise<void> {
	loading ??= loadRecords()
		.then((records) => {
			// Обои, добавленные до конца чтения (если хранилище медленное), остаются
			const added = state.items;
			setState({
				loaded: true,
				items: [
					...records
						.filter(
							(record) => !added.some((item) => item.wallpaper.id === customWallpaperId(record.key))
						)
						.map((record): CustomItem => ({
							wallpaper: {
								id: customWallpaperId(record.key),
								title: record.title,
								kind: 'custom',
								media: record.media,
								url: URL.createObjectURL(record.blob)
							},
							saved: true,
							createdAt: record.createdAt
						})),
					...added
				]
			});
		})
		.catch(() => {
			// Хранилища нет (приватный режим): обои будут жить до перезагрузки
			setState({ ...state, loaded: true });
		});
	return loading;
}

export function useCustomWallpapers(): CustomState {
	return useSyncExternalStore(subscribe, () => state);
}

export type AddResult = { ok: true; id: string; saved: boolean } | { ok: false; message: string };

export async function addCustomWallpaper(file: File): Promise<AddResult> {
	const check = checkFile(file);
	if (!check.ok) return check;
	await loadCustomWallpapers();
	if (state.items.length >= maxCustomWallpapers) {
		return {
			ok: false,
			message: `Можно хранить до ${maxCustomWallpapers} своих обоев. Удалите ненужные`
		};
	}

	const key = newCustomKey();
	const title = customTitle(file.name, check.media);
	const createdAt = Date.now();
	let saved = true;
	try {
		await saveRecord({ key, title, media: check.media, blob: file, createdAt });
	} catch {
		// Хранилище недоступно или нет места: обои всё равно работают до перезагрузки
		saved = false;
	}

	const wallpaper: CustomWallpaper = {
		id: customWallpaperId(key),
		title,
		kind: 'custom',
		media: check.media,
		url: URL.createObjectURL(file)
	};
	setState({ ...state, items: [...state.items, { wallpaper, saved, createdAt }] });
	return { ok: true, id: wallpaper.id, saved };
}

export function removeCustomWallpaper(id: string) {
	const item = state.items.find((entry) => entry.wallpaper.id === id);
	if (!item) return;
	// Фон может ещё показывать этот файл: отпускаем URL после того, как React уберёт слой
	setState({ ...state, items: state.items.filter((entry) => entry !== item) });
	setTimeout(() => URL.revokeObjectURL(item.wallpaper.url), 2000);
	deleteRecord(id.slice('custom/'.length)).catch(() => {});
}
