import { createGlowSprite } from './glowSprite';
import { scaledCount, type EffectRenderer } from './types';

type Firefly = {
	x: number;
	y: number;
	radius: number;
	speed: number;
	heading: number;
	turnFreq: number;
	turnPhase: number;
	pulseSpeed: number;
	pulsePhase: number;
};

const count = 40;

// Свечение до ~20 px в радиусе, при DPR 2 это ~40 px: спрайт 128 px (радиус 64) с запасом против мыла.
// В центре прозрачность 1, настоящую задаёт кадр через globalAlpha
const glowSprite = createGlowSprite(128, (ctx, size) => {
	const c = size / 2;
	const gradient = ctx.createRadialGradient(c, c, 0, c, c, c);
	gradient.addColorStop(0, 'rgba(235, 255, 160, 1)');
	gradient.addColorStop(0.25, 'rgba(190, 240, 90, 0.5)');
	gradient.addColorStop(1, 'rgba(150, 220, 60, 0)');
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, size, size);
});

// Светлячки: жёлто-зелёные точки медленно блуждают по экрану и плавно вспыхивают и гаснут
export function createFireflies(): EffectRenderer {
	const flies: Firefly[] = [];

	function createFirefly(width: number, height: number): Firefly {
		return {
			x: Math.random() * width,
			y: Math.random() * height,
			radius: 1.2 + Math.random() * 1.6,
			speed: 8 + Math.random() * 22,
			heading: Math.random() * Math.PI * 2,
			turnFreq: 0.2 + Math.random() * 0.5,
			turnPhase: Math.random() * Math.PI * 2,
			pulseSpeed: 0.6 + Math.random() * 1.2,
			pulsePhase: Math.random() * Math.PI * 2
		};
	}

	return {
		init(width, height) {
			flies.length = 0;
			const total = scaledCount(count, width, height);
			for (let i = 0; i < total; i++) flies.push(createFirefly(width, height));
		},

		draw(ctx, dt, now, width, height) {
			ctx.globalCompositeOperation = 'lighter';

			for (const f of flies) {
				// Плавно поворачивает то в одну, то в другую сторону — полёт без резких рывков
				f.heading += Math.sin(now * 0.001 * f.turnFreq + f.turnPhase) * 1.2 * dt;
				f.x += Math.cos(f.heading) * f.speed * dt;
				f.y += Math.sin(f.heading) * f.speed * dt;

				// Улетевший за край появляется с противоположной стороны
				if (f.x < -20) f.x = width + 20;
				else if (f.x > width + 20) f.x = -20;
				if (f.y < -20) f.y = height + 20;
				else if (f.y > height + 20) f.y = -20;

				// Большую часть времени тусклый, иногда разгорается: синус в высокой степени
				const wave = (Math.sin(now * 0.001 * f.pulseSpeed + f.pulsePhase) + 1) / 2;
				const alpha = 0.1 + 0.9 * wave ** 3;

				const glow = f.radius * 7;
				ctx.globalAlpha = alpha;
				ctx.drawImage(glowSprite(), f.x - glow, f.y - glow, glow * 2, glow * 2);
			}
		}
	};
}
