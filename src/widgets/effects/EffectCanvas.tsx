import { useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';

import type { EffectRenderer } from './renderers/types';

type EffectCanvasProps = {
	create: () => EffectRenderer;
	layer: 'front' | 'back';
	// Заморозить частицы на месте: последний кадр остаётся на экране, цикл не крутится
	paused: boolean;
};

// Холст на весь экран для одного эффекта: размер под окно и плотность пикселей, цикл requestAnimationFrame,
// пауза в скрытой вкладке. Что рисовать, решает renderer
export function EffectCanvas({ create, layer, paused }: EffectCanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	// Цикл живёт в эффекте ниже и читает паузу через ref, чтобы не пересоздавать частицы при каждом нажатии
	const pausedRef = useRef(paused);
	const resumeRef = useRef(() => {});

	useEffect(() => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext('2d');
		if (!canvas || !ctx) return;

		const renderer = create();
		let animationId = 0;
		let lastTime = performance.now();
		let lastNow = lastTime;
		let width = 0;
		let height = 0;

		function resize() {
			if (!canvas || !ctx) return;
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			width = window.innerWidth;
			height = window.innerHeight;
			canvas.width = Math.floor(width * dpr);
			canvas.height = Math.floor(height * dpr);
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			// Смена размера очищает холст: на паузе перерисовываем тот же кадр без движения
			if (!animationId) drawFrame(0, lastNow);
		}

		function drawFrame(dt: number, now: number) {
			if (!ctx) return;
			ctx.clearRect(0, 0, width, height);
			ctx.globalCompositeOperation = 'source-over';
			renderer.draw(ctx, dt, now, width, height);
		}

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
		renderer.init(width, height);
		// Первый кадр рисуем всегда, даже на паузе, — иначе после перезагрузки эффекта не было бы видно
		animationId = requestAnimationFrame(render);

		window.addEventListener('resize', resize);
		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			cancelAnimationFrame(animationId);
			window.removeEventListener('resize', resize);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, [create]);

	useEffect(() => {
		pausedRef.current = paused;
		if (!paused) resumeRef.current();
	}, [paused]);

	return (
		<canvas
			ref={canvasRef}
			// Окна — z-10, панель — z-20: задний слой между обоями и окнами, передний поверх всего
			className={cn(
				'pointer-events-none fixed inset-0 h-full w-full',
				layer === 'front' ? 'z-50' : 'z-[1]'
			)}
			aria-hidden="true"
		/>
	);
}
