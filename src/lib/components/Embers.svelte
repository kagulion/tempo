<script lang="ts">
	let canvasElement = $state<HTMLCanvasElement>();

	interface Props {
		count?: number;
	}

	let { count = 75 }: Props = $props();

	interface Ember {
		x: number;
		y: number;
		radius: number;
		vy: number;
		vx: number;
		swayAmp: number;
		swayFreq: number;
		swayPhase: number;
		life: number;
		maxLife: number;
		maxAlpha: number;
		flickerSpeed: number;
		flickerPhase: number;
		colorVariant: number; // 0: yellow-gold, 1: warm orange, 2: reddish orange
	}

	$effect(() => {
		const canvas = canvasElement;
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		let animationId: number;
		let lastTime = performance.now();
		let width = 0;
		let height = 0;
		let dpr = 1;

		const particles: Ember[] = [];

		function createEmber(initialSpawn = false): Ember {
			const maxLife = 4 + Math.random() * 6; // 4 to 10 seconds
			return {
				x: Math.random() * width,
				y: initialSpawn ? Math.random() * height : height + Math.random() * 20,
				radius: 1 + Math.random() * 2.2, // 1px to 3.2px
				vy: -(30 + Math.random() * 55), // pixels per second upward
				vx: (Math.random() - 0.5) * 15,
				swayAmp: 15 + Math.random() * 30,
				swayFreq: 0.8 + Math.random() * 1.6,
				swayPhase: Math.random() * Math.PI * 2,
				life: initialSpawn ? Math.random() * maxLife : 0,
				maxLife,
				maxAlpha: 0.4 + Math.random() * 0.5, // 0.4 to 0.9
				flickerSpeed: 3 + Math.random() * 6,
				flickerPhase: Math.random() * Math.PI * 2,
				colorVariant: Math.random() < 0.35 ? 0 : Math.random() < 0.75 ? 1 : 2
			};
		}

		function resize() {
			if (!canvas) return;
			dpr = Math.min(window.devicePixelRatio || 1, 2);
			width = window.innerWidth;
			height = window.innerHeight;

			canvas.width = Math.floor(width * dpr);
			canvas.height = Math.floor(height * dpr);
			canvas.style.width = `${width}px`;
			canvas.style.height = `${height}px`;

			ctx?.scale(dpr, dpr);
		}

		function init() {
			resize();
			particles.length = 0;
			for (let i = 0; i < count; i++) {
				particles.push(createEmber(true));
			}
		}

		function render(now: number) {
			const dt = Math.min((now - lastTime) / 1000, 0.1);
			lastTime = now;

			if (!ctx) return;

			ctx.clearRect(0, 0, width, height);

			// Режим наложения для эффекта свечения пламени
			ctx.globalCompositeOperation = 'lighter';

			for (let i = 0; i < particles.length; i++) {
				const p = particles[i];
				p.life += dt;

				if (p.life >= p.maxLife || p.y < -30) {
					particles[i] = createEmber(false);
					continue;
				}

				// Движение вверх и волнообразное покачивание
				p.y += p.vy * dt;
				const sway = Math.sin(now * 0.001 * p.swayFreq + p.swayPhase) * p.swayAmp * dt;
				p.x += (p.vx + sway) * dt;

				// Расчет прозрачности с плавным появлением, угасанием и мерцанием
				const progress = p.life / p.maxLife;
				let alpha = p.maxAlpha;

				if (progress < 0.15) {
					// Плавное рождение
					alpha *= progress / 0.15;
				} else if (progress > 0.6) {
					// Плавное остывание и угасание
					alpha *= 1 - (progress - 0.6) / 0.4;
				}

				// Легкое мерцание искры
				const flicker = 0.85 + 0.15 * Math.sin(now * 0.001 * p.flickerSpeed + p.flickerPhase);
				alpha = Math.max(0, Math.min(1, alpha * flicker));

				if (alpha <= 0.005) continue;

				// Цветовая палитра: от белого-золотого центра до огненно-оранжевого ореола
				const glowRadius = p.radius * 3.2;
				const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius);

				if (p.colorVariant === 0) {
					// Горячая золотистая искра
					gradient.addColorStop(0, `rgba(255, 250, 210, ${alpha})`);
					gradient.addColorStop(0.3, `rgba(255, 180, 50, ${alpha * 0.8})`);
					gradient.addColorStop(0.7, `rgba(255, 90, 10, ${alpha * 0.3})`);
					gradient.addColorStop(1, `rgba(255, 40, 0, 0)`);
				} else if (p.colorVariant === 1) {
					// Теплая янтарно-оранжевая искра
					gradient.addColorStop(0, `rgba(255, 240, 180, ${alpha})`);
					gradient.addColorStop(0.35, `rgba(255, 130, 20, ${alpha * 0.8})`);
					gradient.addColorStop(0.75, `rgba(240, 60, 5, ${alpha * 0.3})`);
					gradient.addColorStop(1, `rgba(200, 30, 0, 0)`);
				} else {
					// Багровая тлеющая искра
					gradient.addColorStop(0, `rgba(255, 220, 150, ${alpha})`);
					gradient.addColorStop(0.4, `rgba(240, 90, 15, ${alpha * 0.75})`);
					gradient.addColorStop(0.8, `rgba(190, 35, 5, ${alpha * 0.25})`);
					gradient.addColorStop(1, `rgba(140, 10, 0, 0)`);
				}

				ctx.beginPath();
				ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
				ctx.fillStyle = gradient;
				ctx.fill();

				// Яркое горячее ядро искры
				ctx.beginPath();
				ctx.arc(p.x, p.y, p.radius * 0.5, 0, Math.PI * 2);
				ctx.fillStyle = `rgba(255, 255, 230, ${alpha * 0.9})`;
				ctx.fill();
			}

			animationId = requestAnimationFrame(render);
		}

		function handleVisibilityChange() {
			if (document.hidden) {
				cancelAnimationFrame(animationId);
			} else {
				lastTime = performance.now();
				animationId = requestAnimationFrame(render);
			}
		}

		init();
		animationId = requestAnimationFrame(render);

		window.addEventListener('resize', resize);
		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			cancelAnimationFrame(animationId);
			window.removeEventListener('resize', resize);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	});
</script>

<canvas
	bind:this={canvasElement}
	class="pointer-events-none fixed inset-0 z-50 h-full w-full"
	aria-hidden="true"
></canvas>
