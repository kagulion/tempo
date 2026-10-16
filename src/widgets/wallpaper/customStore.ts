import type { CustomMedia } from './custom';

// Хранилище своих обоев в IndexedDB: файл остаётся в браузере посетителя и никуда не отправляется.
// localStorage для этого не годится: он мал и хранит только строки

export type CustomRecord = {
	// Ключ из custom/<ключ>
	key: string;
	title: string;
	media: CustomMedia;
	blob: Blob;
	createdAt: number;
};

const dbName = 'tempo-wallpapers';
const storeName = 'custom';

let dbPromise: Promise<IDBDatabase> | undefined;

function openDb(): Promise<IDBDatabase> {
	dbPromise ??= new Promise((resolve, reject) => {
		if (typeof indexedDB === 'undefined') {
			reject(new Error('IndexedDB недоступна'));
			return;
		}
		const request = indexedDB.open(dbName, 1);
		request.onupgradeneeded = () => {
			request.result.createObjectStore(storeName, { keyPath: 'key' });
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
		request.onblocked = () => reject(new Error('IndexedDB заблокирована'));
	});
	// Не запоминаем неудачу: в следующий раз попробуем снова
	dbPromise.catch(() => {
		dbPromise = undefined;
	});
	return dbPromise;
}

async function run<T>(
	mode: IDBTransactionMode,
	action: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
	const db = await openDb();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(storeName, mode);
		const request = action(transaction.objectStore(storeName));
		transaction.oncomplete = () => resolve(request.result);
		transaction.onerror = () => reject(transaction.error);
		transaction.onabort = () => reject(transaction.error ?? new Error('Запись отменена'));
	});
}

function isRecord(value: unknown): value is CustomRecord {
	if (typeof value !== 'object' || value === null) return false;
	const item = value as Record<string, unknown>;
	return (
		typeof item.key === 'string' &&
		typeof item.title === 'string' &&
		(item.media === 'image' || item.media === 'video') &&
		item.blob instanceof Blob &&
		typeof item.createdAt === 'number'
	);
}

// Все сохранённые обои, старые первыми. Испорченные записи пропускаются
export async function loadRecords(): Promise<CustomRecord[]> {
	const all = await run('readonly', (store) => store.getAll());
	return all.filter(isRecord).sort((a, b) => a.createdAt - b.createdAt);
}

export async function saveRecord(record: CustomRecord): Promise<void> {
	await run('readwrite', (store) => store.put(record));
}

export async function deleteRecord(key: string): Promise<void> {
	await run('readwrite', (store) => store.delete(key));
}
