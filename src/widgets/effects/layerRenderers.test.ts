import { describe, expect, it, vi } from 'vitest';

import { createLayerRenderers } from './layerRenderers';
import type { EffectRenderer } from './renderers/types';

function setup() {
	const created: Record<string, EffectRenderer[]> = { a: [], b: [], c: [] };
	const calls: string[] = [];
	const definitions = (['a', 'b', 'c'] as const).map((id) => ({
		id,
		create: vi.fn((): EffectRenderer => {
			const renderer: EffectRenderer = {
				init: vi.fn(),
				draw: vi.fn(() => {
					calls.push(id);
				})
			};
			created[id].push(renderer);
			return renderer;
		})
	}));
	return { definitions, created, calls, layer: createLayerRenderers(definitions) };
}

function fakeContext() {
	const log: string[] = [];
	const ctx = {
		globalCompositeOperation: 'source-over',
		globalAlpha: 1,
		clearRect: vi.fn(() => log.push('clear')),
		save: vi.fn(() => log.push('save')),
		restore: vi.fn(() => log.push('restore'))
	};
	return { ctx: ctx as unknown as CanvasRenderingContext2D, raw: ctx, log };
}

describe('createLayerRenderers', () => {
	it('создаёт рендерер один раз и вызывает init с размером', () => {
		const { definitions, created, layer } = setup();
		layer.sync(['a'], 800, 600);
		layer.sync(['a'], 800, 600);
		expect(definitions[0].create).toHaveBeenCalledTimes(1);
		expect(created.a[0].init).toHaveBeenCalledExactlyOnceWith(800, 600);
	});

	it('добавление и удаление не пересоздаёт остальные', () => {
		const { definitions, created, layer } = setup();
		layer.sync(['a'], 100, 100);
		layer.sync(['a', 'b'], 100, 100);
		layer.sync(['b'], 100, 100);
		layer.sync(['a', 'b'], 100, 100);
		expect(definitions[1].create).toHaveBeenCalledTimes(1);
		expect(created.b[0].init).toHaveBeenCalledTimes(1);
		// a выключили и включили — это новый рендерер
		expect(definitions[0].create).toHaveBeenCalledTimes(2);
		expect(layer.size).toBe(2);
	});

	it('рисует в порядке списка эффектов, а не порядка id', () => {
		const { calls, layer } = setup();
		layer.sync(['c', 'a', 'b'], 100, 100);
		layer.drawLayer(fakeContext().ctx, 0.016, 1, 100, 100);
		expect(calls).toEqual(['a', 'b', 'c']);
	});

	it('очищает холст один раз и сбрасывает состояние ctx между эффектами', () => {
		const { created, layer } = setup();
		layer.sync(['a', 'b'], 100, 100);
		const { ctx, raw, log } = fakeContext();
		const seen: [string, number][] = [];
		created.a[0].draw = vi.fn(() => {
			raw.globalCompositeOperation = 'lighter';
			raw.globalAlpha = 0.2;
		});
		created.b[0].draw = vi.fn(() => {
			seen.push([raw.globalCompositeOperation, raw.globalAlpha]);
		});
		layer.drawLayer(ctx, 0, 0, 100, 100);
		expect(raw.clearRect).toHaveBeenCalledTimes(1);
		expect(log).toEqual(['clear', 'save', 'restore', 'save', 'restore']);
		expect(seen).toEqual([['source-over', 1]]);
	});
});
