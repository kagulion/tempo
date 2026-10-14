import { useEffect, useRef } from 'react';

import type { EffectRenderer } from './renderers/types';

type EffectCanvasProps = {
	create: () => EffectRenderer;
};

// Холст на весь экран для одного эффекта: размер под окно и плотность пикселей, цикл requestAnimationFrame,
// пауза в скрытой вкладке. Что рисовать, решает renderer
export function EffectCanvas({ create }: EffectCanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext('2d');
		if (!canvas || !ctx) return;

		const renderer = create();
		let animationId = 0;
		let lastTime = performance.now();
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
		}

		function render(now: number) {
			if (!ctx) return;
			// После долгой паузы (вкладка была в фоне) не даём частицам прыгнуть
			const dt = Math.min((now - lastTime) / 1000, 0.1);
			lastTime = now;

			ctx.clearRect(0, 0, width, height);
			ctx.globalCompositeOperation = 'source-over';
			renderer.draw(ctx, dt, now, width, height);

			animationId = requestAnimationFrame(render);
		}

		function handleVisibilityChange() {
			cancelAnimationFrame(animationId);
			if (!document.hidden) {
				lastTime = performance.now();
				animationId = requestAnimationFrame(render);
			}
		}

		resize();
		renderer.init(width, height);
		animationId = requestAnimationFrame(render);

		window.addEventListener('resize', resize);
		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			cancelAnimationFrame(animationId);
			window.removeEventListener('resize', resize);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, [create]);

	return (
		<canvas
			ref={canvasRef}
			className="pointer-events-none fixed inset-0 z-50 h-full w-full"
			aria-hidden="true"
		/>
	);
}
