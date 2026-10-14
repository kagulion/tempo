import { matchesMedia, mediaQueries } from '@/lib/media';

import { scaledCount, type EffectRenderer } from './types';

type Drop = {
	x: number;
	y: number;
	length: number;
	speed: number;
	alpha: number;
	width: number;
};

type Range = [min: number, max: number];

type RainOptions = {
	// Капель на экране 1920×1080
	count: number;
	// Косой ветер: на каждый пиксель вниз капля сдвигается на столько пикселей вправо
	slant: number;
	// Диапазоны от дальних капель к ближним
	length: Range;
	speed: Range;
	alpha: Range;
	width: Range;
	// Редкие вспышки молнии
	lightning?: boolean;
};

const lerp = ([min, max]: Range, t: number) => min + (max - min) * t;

// Дождь: тонкие полупрозрачные штрихи падают сверху вниз с наклоном.
// Дальние капли короче, медленнее и бледнее — так появляется глубина
function createRainEffect(options: RainOptions): EffectRenderer {
	const drops: Drop[] = [];
	const { slant } = options;

	// Молния: пауза до следующей вспышки и время с начала текущей
	let nextFlash = 0;
	let flashTime = Infinity;
	// При «уменьшить движение» в системе вспышек нет: резкая смена яркости бывает неприятна
	let flashes = false;

	function createDrop(width: number, height: number, initialSpawn: boolean): Drop {
		const depth = Math.random(); // 0 — далеко, 1 — близко
		const length = lerp(options.length, depth);
		return {
			// Из-за наклона капли уходят вправо, поэтому рождаем их и левее экрана
			x: Math.random() * (width + height * slant) - height * slant,
			y: initialSpawn ? Math.random() * height : -length - Math.random() * height * 0.3,
			length,
			speed: lerp(options.speed, depth),
			alpha: lerp(options.alpha, depth),
			width: lerp(options.width, depth)
		};
	}

	// Двойная вспышка: яркая, короткий провал, слабее, затухание. Всего ~0.6 с
	function flashAlpha(t: number) {
		if (t < 0.08) return 0.22 * (1 - t / 0.08);
		if (t < 0.14) return 0;
		if (t < 0.6) return 0.14 * (1 - (t - 0.14) / 0.46);
		return 0;
	}

	return {
		init(width, height) {
			drops.length = 0;
			const total = scaledCount(options.count, width, height);
			for (let i = 0; i < total; i++) drops.push(createDrop(width, height, true));
			nextFlash = 6 + Math.random() * 10;
			flashes = Boolean(options.lightning) && !matchesMedia(mediaQueries.reducedMotion);
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

			if (!flashes) return;

			nextFlash -= dt;
			if (nextFlash <= 0) {
				flashTime = 0;
				nextFlash = 8 + Math.random() * 14;
			}
			flashTime += dt;
			const alpha = flashAlpha(flashTime);
			if (alpha > 0) {
				ctx.fillStyle = `rgba(225, 232, 255, ${alpha})`;
				ctx.fillRect(0, 0, width, height);
			}
		}
	};
}

export function createRain() {
	return createRainEffect({
		count: 320,
		slant: 0.12,
		length: [14, 40],
		speed: [700, 1400],
		alpha: [0.2, 0.55],
		width: [0.8, 1.5]
	});
}

// Ливень: капель вдвое больше, они длиннее и быстрее, ветер сильнее, иногда сверкает молния
export function createHeavyRain() {
	return createRainEffect({
		count: 700,
		slant: 0.22,
		length: [22, 60],
		speed: [1100, 2100],
		alpha: [0.18, 0.5],
		width: [0.9, 1.7],
		lightning: true
	});
}
