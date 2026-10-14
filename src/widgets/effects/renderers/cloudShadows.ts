import type { EffectRenderer } from './types';

type Blob = { dx: number; dy: number; radius: number };

type Cloud = {
	x: number;
	y: number;
	speed: number;
	// Насколько облако выступает от центра: по этому решаем, что оно целиком ушло за край
	extent: number;
	blobs: Blob[];
};

const count = 5;
const darkness = 0.28;

// Тени облаков: большие мягкие тёмные пятна медленно плывут по фону слева направо.
// Стоит под окнами (layer: 'back'), чтобы не затемнять их
export function createCloudShadows(): EffectRenderer {
	const clouds: Cloud[] = [];

	function createCloud(width: number, height: number, initialSpawn: boolean): Cloud {
		const scale = Math.max(width, height) / 1920;
		const base = (220 + Math.random() * 200) * scale;
		// Облако — несколько перекрывающихся пятен, так край получается неровным
		const blobs: Blob[] = Array.from({ length: 3 + Math.floor(Math.random() * 3) }, () => ({
			dx: (Math.random() - 0.5) * base * 1.6,
			dy: (Math.random() - 0.5) * base * 0.6,
			radius: base * (0.6 + Math.random() * 0.5)
		}));
		const extent = Math.max(...blobs.map((b) => Math.abs(b.dx) + b.radius));
		return {
			x: initialSpawn ? Math.random() * (width + extent * 2) - extent : -extent,
			y: Math.random() * height,
			speed: (12 + Math.random() * 18) * scale,
			extent,
			blobs
		};
	}

	return {
		init(width, height) {
			clouds.length = 0;
			for (let i = 0; i < count; i++) clouds.push(createCloud(width, height, true));
		},

		draw(ctx, dt, _now, width, height) {
			for (let i = 0; i < clouds.length; i++) {
				const c = clouds[i];
				c.x += c.speed * dt;

				if (c.x - c.extent > width) {
					clouds[i] = createCloud(width, height, false);
					continue;
				}

				for (const b of c.blobs) {
					const x = c.x + b.dx;
					const y = c.y + b.dy;
					const gradient = ctx.createRadialGradient(x, y, 0, x, y, b.radius);
					gradient.addColorStop(0, `rgba(0, 0, 0, ${darkness / 2})`);
					gradient.addColorStop(0.6, `rgba(0, 0, 0, ${darkness / 4})`);
					gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
					ctx.fillStyle = gradient;
					ctx.fillRect(x - b.radius, y - b.radius, b.radius * 2, b.radius * 2);
				}
			}
		}
	};
}
