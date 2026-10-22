import type { EffectRenderer } from './renderers/types';

// Всё, что нужно слою от описания эффекта: id и фабрика рендерера
type LayerEffect<Id extends string> = {
	id: Id;
	create: () => EffectRenderer;
};

// Живые рендереры одного слоя: все они рисуются на одном холсте.
// definitions — список эффектов слоя в порядке отрисовки (порядок массива effects)
export function createLayerRenderers<Id extends string>(definitions: readonly LayerEffect<Id>[]) {
	const alive = new Map<Id, EffectRenderer>();

	return {
		// Приводит набор рендереров к списку включённых id: новым делает create и init, выключенные удаляет,
		// остальные не трогает — иначе при включении дождя огоньки начинались бы заново
		sync(ids: readonly Id[], width: number, height: number) {
			for (const id of alive.keys()) {
				if (!ids.includes(id)) alive.delete(id);
			}
			for (const definition of definitions) {
				if (!ids.includes(definition.id) || alive.has(definition.id)) continue;
				const renderer = definition.create();
				renderer.init(width, height);
				alive.set(definition.id, renderer);
			}
		},

		// Один кадр слоя: очистка, затем эффекты по порядку. Режим наложения и прозрачность одного эффекта
		// («lighter» у огоньков, globalAlpha у листьев) не должны попадать на другие
		drawLayer(
			ctx: CanvasRenderingContext2D,
			dt: number,
			now: number,
			width: number,
			height: number
		) {
			ctx.clearRect(0, 0, width, height);
			for (const definition of definitions) {
				const renderer = alive.get(definition.id);
				if (!renderer) continue;
				ctx.save();
				ctx.globalCompositeOperation = 'source-over';
				ctx.globalAlpha = 1;
				renderer.draw(ctx, dt, now, width, height);
				ctx.restore();
			}
		},

		get size() {
			return alive.size;
		}
	};
}
