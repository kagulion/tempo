import { scaledCount, type EffectRenderer } from './types';

type Drop = {
	x: number;
	y: number;
	length: number;
	speed: number;
	alpha: number;
	width: number;
};

const count = 320;
// Лёгкий косой ветер: на каждый пиксель вниз капля сдвигается на столько пикселей вправо
const slant = 0.12;

// Дождь: тонкие полупрозрачные штрихи падают сверху вниз с небольшим наклоном.
// Дальние капли короче, медленнее и бледнее — так появляется глубина
export function createRain(): EffectRenderer {
	const drops: Drop[] = [];

	function createDrop(width: number, height: number, initialSpawn: boolean): Drop {
		const depth = Math.random(); // 0 — далеко, 1 — близко
		const length = 14 + depth * 26;
		return {
			// Из-за наклона капли уходят вправо, поэтому рождаем их и левее экрана
			x: Math.random() * (width + height * slant) - height * slant,
			y: initialSpawn ? Math.random() * height : -length - Math.random() * height * 0.3,
			length,
			speed: 700 + depth * 700,
			alpha: 0.2 + depth * 0.35,
			width: 0.8 + depth * 0.7
		};
	}

	return {
		init(width, height) {
			drops.length = 0;
			const total = scaledCount(count, width, height);
			for (let i = 0; i < total; i++) drops.push(createDrop(width, height, true));
		},

		draw(ctx, dt, _now, width, height) {
			ctx.lineCap = 'round';

			for (let i = 0; i < drops.length; i++) {
				const d = drops[i];
				d.y += d.speed * dt;
				d.x += d.speed * slant * dt;

				if (d.y - d.length > height) {
					drops[i] = createDrop(width, height, false);
					continue;
				}

				ctx.beginPath();
				ctx.moveTo(d.x, d.y);
				ctx.lineTo(d.x - d.length * slant, d.y - d.length);
				ctx.lineWidth = d.width;
				ctx.strokeStyle = `rgba(215, 228, 245, ${d.alpha})`;
				ctx.stroke();
			}
		}
	};
}
