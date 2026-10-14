import { scaledCount, type EffectRenderer } from './types';

type Flake = {
	x: number;
	y: number;
	radius: number;
	speed: number;
	alpha: number;
	swayAmp: number;
	swayFreq: number;
	swayPhase: number;
};

const count = 170;

// Снег: хлопья медленно падают и покачиваются из стороны в сторону.
// Ближние хлопья крупнее, быстрее и ярче
export function createSnow(): EffectRenderer {
	const flakes: Flake[] = [];

	function createFlake(width: number, height: number, initialSpawn: boolean): Flake {
		const depth = Math.random(); // 0 — далеко, 1 — близко
		const radius = 0.8 + depth * 2.4;
		return {
			x: Math.random() * width,
			y: initialSpawn ? Math.random() * height : -radius - Math.random() * 40,
			radius,
			speed: 25 + depth * 55,
			alpha: 0.35 + depth * 0.5,
			swayAmp: 10 + Math.random() * 25,
			swayFreq: 0.3 + Math.random() * 0.7,
			swayPhase: Math.random() * Math.PI * 2
		};
	}

	return {
		init(width, height) {
			flakes.length = 0;
			const total = scaledCount(count, width, height);
			for (let i = 0; i < total; i++) flakes.push(createFlake(width, height, true));
		},

		draw(ctx, dt, now, width, height) {
			for (let i = 0; i < flakes.length; i++) {
				const f = flakes[i];
				f.y += f.speed * dt;
				f.x += Math.cos(now * 0.001 * f.swayFreq + f.swayPhase) * f.swayAmp * dt;

				// Хлопья, унесённые за край, тоже рождаются заново сверху
				if (f.y - f.radius > height || f.x < -20 || f.x > width + 20) {
					flakes[i] = createFlake(width, height, false);
					continue;
				}

				ctx.beginPath();
				ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
				ctx.fillStyle = `rgba(255, 255, 255, ${f.alpha})`;
				ctx.fill();
			}
		}
	};
}
