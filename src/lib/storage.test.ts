import { afterEach, describe, expect, it, vi } from 'vitest';

import { createPersistentStore, isRecord, loadStored, saveStored, storageKeys } from './storage';

// localStorage в памяти: тесты идут в Node, где его нет
function memoryStorage() {
	const data = new Map<string, string>();
	return {
		getItem: (key: string) => data.get(key) ?? null,
		setItem: (key: string, value: string) => void data.set(key, value),
		removeItem: (key: string) => void data.delete(key),
		data
	};
}

// Хранилище, которое бросает исключение, как в приватном режиме Safari
const brokenStorage = {
	getItem: () => {
		throw new Error('SecurityError');
	},
	setItem: () => {
		throw new Error('QuotaExceededError');
	}
};

const key = storageKeys.wallpaper;
const parseNumber = (saved: unknown) => (typeof saved === 'number' ? saved : undefined);

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('isRecord', () => {
	it('принимает только обычные объекты', () => {
		expect(isRecord({ a: 1 })).toBe(true);
		expect(isRecord([])).toBe(false);
		expect(isRecord(null)).toBe(false);
		expect(isRecord('text')).toBe(false);
	});
});

describe('loadStored и saveStored', () => {
	it('сохраняет значение в JSON и читает его обратно', () => {
		const storage = memoryStorage();
		vi.stubGlobal('localStorage', storage);
		saveStored(key, 42);
		expect(storage.data.get(key)).toBe('42');
		expect(loadStored(key, 0, parseNumber)).toBe(42);
	});

	it('без сохранённого значения отдаёт значение по умолчанию', () => {
		vi.stubGlobal('localStorage', memoryStorage());
		expect(loadStored(key, 7, parseNumber)).toBe(7);
	});

	it('испорченный JSON и данные не того вида заменяет значением по умолчанию', () => {
		const storage = memoryStorage();
		vi.stubGlobal('localStorage', storage);
		storage.data.set(key, '{oops');
		expect(loadStored(key, 7, parseNumber)).toBe(7);
		storage.data.set(key, '"text"');
		expect(loadStored(key, 7, parseNumber)).toBe(7);
	});

	it('не падает, когда хранилище недоступно', () => {
		vi.stubGlobal('localStorage', brokenStorage);
		expect(loadStored(key, 7, parseNumber)).toBe(7);
		expect(() => saveStored(key, 1)).not.toThrow();
	});
});

describe('createPersistentStore', () => {
	it('читает сохранённое значение при первом обращении, а не при создании', () => {
		const storage = memoryStorage();
		vi.stubGlobal('localStorage', storage);
		const store = createPersistentStore(key, 0, parseNumber);
		storage.data.set(key, '5');
		expect(store.get()).toBe(5);
	});

	it('сохраняет новое значение и сообщает подписчикам', () => {
		const storage = memoryStorage();
		vi.stubGlobal('localStorage', storage);
		const store = createPersistentStore(key, 0, parseNumber);
		const listener = vi.fn();
		const unsubscribe = store.subscribe(listener);

		store.set(1);
		store.set((current) => current + 1);
		expect(store.get()).toBe(2);
		expect(storage.data.get(key)).toBe('2');
		expect(listener).toHaveBeenCalledTimes(2);

		unsubscribe();
		store.set(3);
		expect(listener).toHaveBeenCalledTimes(2);
	});

	describe('событие storage из другой вкладки', () => {
		// Окно с одним обработчиком: dispatch зовёт его так же, как браузер зовёт его при изменении в другой вкладке
		function stubWindowEvents() {
			const handlers: ((event: { key: string | null }) => void)[] = [];
			vi.stubGlobal(
				'addEventListener',
				(type: string, handler: (event: { key: string | null }) => void) => {
					if (type === 'storage') handlers.push(handler);
				}
			);
			return (eventKey: string | null) => handlers.forEach((handler) => handler({ key: eventKey }));
		}

		it('перечитывает значение и сообщает подписчикам', () => {
			const storage = memoryStorage();
			vi.stubGlobal('localStorage', storage);
			const dispatch = stubWindowEvents();
			const store = createPersistentStore(key, 0, parseNumber);
			const listener = vi.fn();
			store.subscribe(listener);
			store.set(1);

			storage.data.set(key, '8');
			dispatch(key);
			expect(store.get()).toBe(8);
			expect(listener).toHaveBeenCalledTimes(2);
		});

		it('следующая запись строится от чужого значения, а не от старой копии', () => {
			const storage = memoryStorage();
			vi.stubGlobal('localStorage', storage);
			const dispatch = stubWindowEvents();
			const store = createPersistentStore(key, 0, parseNumber);
			store.set(1);

			storage.data.set(key, '10');
			dispatch(key);
			store.set((current) => current + 1);
			expect(storage.data.get(key)).toBe('11');
		});

		it('игнорирует чужие ключи, а очистку хранилища читает как значение по умолчанию', () => {
			const storage = memoryStorage();
			vi.stubGlobal('localStorage', storage);
			const dispatch = stubWindowEvents();
			const store = createPersistentStore(key, 0, parseNumber);
			store.set(4);

			dispatch(storageKeys.dimmer);
			expect(store.get()).toBe(4);

			storage.data.clear();
			dispatch(null);
			expect(store.get()).toBe(0);
		});

		it('испорченное чужое значение заменяет значением по умолчанию', () => {
			const storage = memoryStorage();
			vi.stubGlobal('localStorage', storage);
			const dispatch = stubWindowEvents();
			const store = createPersistentStore(key, 0, parseNumber);
			store.set(4);

			storage.data.set(key, '"text"');
			dispatch(key);
			expect(store.get()).toBe(0);
		});
	});

	it('работает в памяти, когда хранилище недоступно', () => {
		vi.stubGlobal('localStorage', brokenStorage);
		const store = createPersistentStore(key, 0, parseNumber);
		store.set(9);
		expect(store.get()).toBe(9);
	});
});
