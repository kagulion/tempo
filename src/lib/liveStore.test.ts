import { describe, expect, it, vi } from 'vitest';

import { createLiveStore } from './liveStore';

describe('createLiveStore', () => {
	it('запускает источник при первом подписчике и останавливает при последней отписке', () => {
		const stop = vi.fn();
		const start = vi.fn(() => stop);
		const store = createLiveStore(() => 0, start);

		const off1 = store.subscribe(() => {});
		const off2 = store.subscribe(() => {});
		expect(start).toHaveBeenCalledTimes(1);

		off1();
		expect(stop).not.toHaveBeenCalled();
		off2();
		expect(stop).toHaveBeenCalledTimes(1);
	});

	it('повторная отписка не останавливает источник второй раз', () => {
		const stop = vi.fn();
		const store = createLiveStore(
			() => 0,
			() => stop
		);
		const off = store.subscribe(() => {});
		off();
		off();
		expect(stop).toHaveBeenCalledTimes(1);
	});

	it('оповещает подписчиков о новом значении и не трогает их, если оно то же', () => {
		let set: (next: number) => void = () => {};
		const store = createLiveStore(
			() => 1,
			(write) => {
				set = write;
				return () => {};
			}
		);
		const listener = vi.fn();
		store.subscribe(listener);

		set(1);
		expect(listener).not.toHaveBeenCalled();
		set(2);
		expect(listener).toHaveBeenCalledTimes(1);
		expect(store.get()).toBe(2);
	});

	it('после остановки возвращается к начальному значению', () => {
		let set: (next: number) => void = () => {};
		const store = createLiveStore(
			() => 1,
			(write) => {
				set = write;
				return () => {};
			}
		);
		const off = store.subscribe(() => {});
		set(5);
		off();
		expect(store.get()).toBe(1);
	});
});
