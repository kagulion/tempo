import { beforeEach, describe, expect, it, vi } from 'vitest';

// Состояние приглушения живёт в модуле, поэтому каждый тест получает свежую копию
async function freshDucking() {
	vi.resetModules();
	return import('./ducking');
}

beforeEach(() => {
	vi.useRealTimers();
});

describe('duckLevel', () => {
	it('без ожидаемого сигнала громкость полная', async () => {
		const { duckLevel, isDucking } = await freshDucking();
		expect(duckLevel(1000)).toBe(1);
		expect(isDucking(1000)).toBe(false);
	});

	it('плавно затихает к моменту сигнала', async () => {
		const { duckBefore, duckFade, duckLevel, isDucking } = await freshDucking();
		const signal = 100_000;
		duckBefore(signal);

		expect(duckLevel(signal - duckFade - 1000)).toBe(1);
		expect(duckLevel(signal - duckFade / 2)).toBeCloseTo(0.5);
		expect(duckLevel(signal)).toBe(0);
		expect(isDucking(0)).toBe(true);
	});

	it('после сигнала молчит, пока не начнётся возврат, и плавно возвращается', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(50_000);
		const { duckBefore, duckFade, duckLevel, isDucking, restoreAfter } = await freshDucking();

		// Сигнал прозвучал: ожидание снято, возврат начнётся через 1,6 с
		duckBefore(null);
		restoreAfter(1600);
		const fadeInAt = 50_000 + 1600;

		expect(duckLevel(fadeInAt - 1)).toBe(0);
		expect(duckLevel(fadeInAt + duckFade / 2)).toBeCloseTo(0.5);
		expect(duckLevel(fadeInAt + duckFade)).toBe(1);
		expect(isDucking(fadeInAt + duckFade / 2)).toBe(true);
		expect(isDucking(fadeInAt + duckFade + 1)).toBe(false);
	});

	it('сообщает подписчикам об изменениях, но не о повторе того же момента', async () => {
		const { duckBefore, subscribeDucking } = await freshDucking();
		const listener = vi.fn();
		subscribeDucking(listener);

		duckBefore(10_000);
		duckBefore(10_000);
		expect(listener).toHaveBeenCalledTimes(1);
	});
});
