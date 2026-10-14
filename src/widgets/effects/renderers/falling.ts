import { scaledCount, type EffectRenderer } from './types';

type Piece = {
	x: number;
	y: number;
	size: number;
	color: string;
	alpha: number;
	fall: number;
	swayAmp: number;
	swayFreq: number;
	swayPhase: number;
	angle: number;
	spin: number;
	// Переворот в воздухе: сплющивание по одной оси по косинусу
	flip: number;
	flipSpeed: number;
};

type FallingOptions = {
	// Штук на экране 1920×1080
	count: number;
	size: [min: number, max: number];
	fall: [min: number, max: number];
	// Ветер вправо, пикселей в секунду
	wind: number;
	colors: string[];
	shape: (ctx: CanvasRenderingContext2D, size: number) => void;
};

// Падающие листья или лепестки: кружатся, переворачиваются, их сносит ветром вправо
function createFalling(options: FallingOptions): EffectRenderer {
	const pieces: Piece[] = [];

	function createPiece(width: number, height: number, initialSpawn: boolean): Piece {
		const depth = Math.random(); // 0 — далеко, 1 — близко
		const [minSize, maxSize] = options.size;
		const [minFall, maxFall] = options.fall;
		return {
			// Ветер сносит вправо, поэтому новые рождаются и левее экрана
			x: initialSpawn ? Math.random() * width : Math.random() * (width * 1.3) - width * 0.3,
			y: initialSpawn ? Math.random() * height : -maxSize * 2 - Math.random() * 60,
			size: minSize + (maxSize - minSize) * depth,
			color: options.colors[Math.floor(Math.random() * options.colors.length)],
			alpha: 0.55 + depth * 0.4,
			fall: minFall + (maxFall - minFall) * depth,
			swayAmp: 20 + Math.random() * 40,
			swayFreq: 0.4 + Math.random() * 0.8,
			swayPhase: Math.random() * Math.PI * 2,
			angle: Math.random() * Math.PI * 2,
			spin: (Math.random() - 0.5) * 2.5,
			flip: Math.random() * Math.PI * 2,
			flipSpeed: 1 + Math.random() * 2.5
		};
	}

	return {
		init(width, height) {
			pieces.length = 0;
			const total = scaledCount(options.count, width, height);
			for (let i = 0; i < total; i++) pieces.push(createPiece(width, height, true));
		},

		draw(ctx, dt, now, width, height) {
			for (let i = 0; i < pieces.length; i++) {
				const p = pieces[i];
				p.y += p.fall * dt;
				p.x += (options.wind + Math.sin(now * 0.001 * p.swayFreq + p.swayPhase) * p.swayAmp) * dt;
				p.angle += p.spin * dt;
				p.flip += p.flipSpeed * dt;

				if (p.y - p.size * 2 > height || p.x - p.size * 2 > width) {
					pieces[i] = createPiece(width, height, false);
					continue;
				}

				ctx.save();
				ctx.translate(p.x, p.y);
				ctx.rotate(p.angle);
				// Не сплющиваем до нуля: совсем плоский лист выглядит как мигание
				ctx.scale(1, 0.25 + 0.75 * Math.abs(Math.cos(p.flip)));
				ctx.globalAlpha = p.alpha;
				ctx.fillStyle = p.color;
				options.shape(ctx, p.size);
				ctx.restore();
			}
		}
	};
}

// Лист: два изгиба от черенка к кончику и прожилка посередине
function leafShape(ctx: CanvasRenderingContext2D, size: number) {
	ctx.beginPath();
	ctx.moveTo(0, -size);
	ctx.quadraticCurveTo(size * 0.7, -size * 0.2, 0, size);
	ctx.quadraticCurveTo(-size * 0.7, -size * 0.2, 0, -size);
	ctx.fill();

	ctx.beginPath();
	ctx.moveTo(0, -size * 0.85);
	ctx.lineTo(0, size * 1.15);
	ctx.lineWidth = Math.max(0.6, size * 0.08);
	ctx.strokeStyle = 'rgba(60, 30, 10, 0.45)';
	ctx.stroke();
}

// Лепесток сакуры: овал с выемкой на широком конце
function petalShape(ctx: CanvasRenderingContext2D, size: number) {
	ctx.beginPath();
	ctx.moveTo(0, size);
	ctx.bezierCurveTo(size * 0.9, size * 0.4, size * 0.7, -size * 0.8, size * 0.2, -size);
	ctx.lineTo(0, -size * 0.7);
	ctx.lineTo(-size * 0.2, -size);
	ctx.bezierCurveTo(-size * 0.7, -size * 0.8, -size * 0.9, size * 0.4, 0, size);
	ctx.fill();
}

export function createLeaves() {
	return createFalling({
		count: 36,
		size: [8, 16],
		fall: [35, 80],
		wind: 25,
		colors: ['#c2410c', '#d97706', '#b45309', '#a16207', '#9a3412', '#ca8a04'],
		shape: leafShape
	});
}

export function createCherryBlossom() {
	return createFalling({
		count: 90,
		size: [5, 9],
		fall: [25, 60],
		wind: 35,
		colors: ['#fbcfe8', '#f9a8d4', '#fce7f3', '#f472b6'],
		shape: petalShape
	});
}
