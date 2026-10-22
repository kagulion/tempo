import { createGlowSprite } from './glowSprite';
import type { EffectRenderer } from './types';

type Ember = {
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
};

const count = 75;

// Свечение до ~10 px в радиусе, при DPR 2 это ~20 px: спрайт 64 px (радиус 32) с запасом против мыла
const spriteSize = 64;
// Радиус ядра относительно радиуса свечения (radius * 0.5 против radius * 3.2)
const coreRatio = 0.5 / 3.2;

// Палитра: от белого-золотого центра до огненно-оранжевого ореола. В центре прозрачность 1,
// настоящую задаёт кадр через globalAlpha
function createEmberSprite(stops: [offset: number, color: string][]) {
	return createGlowSprite(spriteSize, (ctx, size) => {
		const c = size / 2;
		const gradient = ctx.createRadialGradient(c, c, 0, c, c, c);
		for (const [offset, color] of stops) gradient.addColorStop(offset, color);
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, size, size);
		// Яркое горячее ядро искры
		ctx.globalCompositeOperation = 'lighter';
		ctx.beginPath();
		ctx.arc(c, c, c * coreRatio, 0, Math.PI * 2);
		ctx.fillStyle = 'rgba(255, 255, 230, 0.9)';
		ctx.fill();
	});
}

// Индекс — colorVariant огонька
const sprites = [
	// Горячая золотистая искра
	createEmberSprite([
		[0, 'rgba(255, 250, 210, 1)'],
		[0.3, 'rgba(255, 180, 50, 0.8)'],
		[0.7, 'rgba(255, 90, 10, 0.3)'],
		[1, 'rgba(255, 40, 0, 0)']
	]),
	// Тёплая янтарно-оранжевая искра
	createEmberSprite([
		[0, 'rgba(255, 240, 180, 1)'],
		[0.35, 'rgba(255, 130, 20, 0.8)'],
		[0.75, 'rgba(240, 60, 5, 0.3)'],
		[1, 'rgba(200, 30, 0, 0)']
	]),
	// Багровая тлеющая искра
	createEmberSprite([
		[0, 'rgba(255, 220, 150, 1)'],
		[0.4, 'rgba(240, 90, 15, 0.75)'],
		[0.8, 'rgba(190, 35, 5, 0.25)'],
		[1, 'rgba(140, 10, 0, 0)']
	])
];

// Огоньки: искры поднимаются снизу, покачиваются, мерцают и гаснут
export function createEmbers(): EffectRenderer {
	const particles: Ember[] = [];

	function createEmber(width: number, height: number, initialSpawn: boolean): Ember {
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

	return {
		init(width, height) {
			particles.length = 0;
			for (let i = 0; i < count; i++) particles.push(createEmber(width, height, true));
		},

		draw(ctx, dt, now, width, height) {
			// Режим наложения для эффекта свечения пламени
			ctx.globalCompositeOperation = 'lighter';

			for (let i = 0; i < particles.length; i++) {
				const p = particles[i];
				p.life += dt;

				if (p.life >= p.maxLife || p.y < -30) {
					particles[i] = createEmber(width, height, false);
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

				// Свечение и горячее ядро запечены в спрайт цвета: размер задаёт радиус, яркость — globalAlpha
				const glowRadius = p.radius * 3.2;
				ctx.globalAlpha = alpha;
				ctx.drawImage(
					sprites[p.colorVariant](),
					p.x - glowRadius,
					p.y - glowRadius,
					glowRadius * 2,
					glowRadius * 2
				);
			}
		}
	};
}
