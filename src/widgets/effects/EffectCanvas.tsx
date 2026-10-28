import { useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';

import { type EffectId, effects } from './effects';
import { createLayerRenderers } from './layerRenderers';

type EffectCanvasProps = {
	// Включённые эффекты этого слоя
	ids: EffectId[];
	layer: 'front' | 'back';
	// Заморозить частицы на месте: последний кадр остаётся на экране, цикл не крутится
	paused: boolean;
};

// Один холст на весь экран для всех эффектов слоя: полноэкранные холсты дорого компоновать на GPU, поэтому
// их не больше двух. Размер под рамку страницы и плотность пикселей, цикл requestAnimationFrame, пауза в скрытой вкладке.
// Что рисовать, решают renderer-ы
export function EffectCanvas({ ids, layer, paused }: EffectCanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	// Цикл живёт в эффекте ниже и читает список и паузу через ref: он не перезапускается при их смене,
	// а частицы остальных эффектов не сбрасываются
	const idsRef = useRef(ids);
	const pausedRef = useRef(paused);
	const resumeRef = useRef(() => {});
	const syncRef = useRef(() => {});

	useEffect(() => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext('2d');
		if (!canvas || !ctx) return;

		const layerRenderers = createLayerRenderers(effects.filter((effect) => effect.layer === layer));
		let animationId = 0;
		let lastTime = performance.now();
		let lastNow = lastTime;
		let width = 0;
		let height = 0;

		function resize() {
			if (!canvas || !ctx) return;
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			// Размер холста — размер рамки страницы, а не окна браузера
			width = canvas.clientWidth;
			height = canvas.clientHeight;
			canvas.width = Math.floor(width * dpr);
			canvas.height = Math.floor(height * dpr);
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			// Смена размера очищает холст: на паузе перерисовываем тот же кадр без движения
			if (!animationId) drawFrame(0, lastNow);
		}

		function drawFrame(dt: number, now: number) {
			if (!ctx) return;
			layerRenderers.drawLayer(ctx, dt, now, width, height);
		}

		// Включённые эффекты изменились: новые создаём, выключенные убираем. На паузе кадр не крутится,
		// поэтому новый эффект рисуем одним кадром без движения, чтобы он был виден
		function sync() {
			layerRenderers.sync(idsRef.current, width, height);
			if (!animationId) drawFrame(0, lastNow);
		}
		syncRef.current = sync;

		function render(now: number) {
			// После долгой паузы (вкладка была в фоне) не даём частицам прыгнуть
			const dt = Math.min((now - lastTime) / 1000, 0.1);
			lastTime = now;
			lastNow = now;
			drawFrame(dt, now);
			// На паузе этот кадр последний
			animationId = pausedRef.current ? 0 : requestAnimationFrame(render);
		}

		function start() {
			if (animationId || document.hidden) return;
			lastTime = performance.now();
			animationId = requestAnimationFrame(render);
		}
		resumeRef.current = start;

		function handleVisibilityChange() {
			if (document.hidden) {
				cancelAnimationFrame(animationId);
				animationId = 0;
			} else if (!pausedRef.current) start();
		}

		resize();
		layerRenderers.sync(idsRef.current, width, height);
		// Первый кадр рисуем всегда, даже на паузе, — иначе после перезагрузки эффекта не было бы видно
		animationId = requestAnimationFrame(render);

		// Рамка меняется не только с окном (полный экран убирает панель и поля), поэтому следим за самим холстом
		const observer = new ResizeObserver(resize);
		observer.observe(canvas);
		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			cancelAnimationFrame(animationId);
			observer.disconnect();
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, [layer]);

	useEffect(() => {
		idsRef.current = ids;
		syncRef.current();
	}, [ids]);

	useEffect(() => {
		pausedRef.current = paused;
		if (!paused) resumeRef.current();
	}, [paused]);

	return (
		<canvas
			ref={canvasRef}
			// Окна — z-10, панель — z-20: задний слой между обоями и окнами, передний поверх всего
			className={cn(
				'pointer-events-none absolute inset-0 h-full w-full',
				layer === 'front' ? 'z-50' : 'z-[1]'
			)}
			aria-hidden="true"
		/>
	);
}
