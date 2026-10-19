// Делает варианты обоев-картинок и превью: pnpm wallpaper:variants [--force]
// Нужен ffmpeg в PATH (с libwebp и libaom-av1). Оригиналы не меняются, файлы лежат рядом с ними:
//   src/assets/wallpapers/<категория>/<имя>.webp            оригинал 2752×1536
//   .../<имя>.1280.webp|avif, .1920.webp|avif, .2752.avif   по ширине
//   .../<имя>.p576|p864|p1152.webp|avif                     портретные кропы по центру
//   .../thumbs/<категория>/<имя>.240.webp                   превью 240px (480px — существующие файлы)
// Готовые файлы пропускаются, если они новее оригинала. --force пересоздаёт всё
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
	formats,
	fullHeight,
	fullWidth,
	isVariantFile,
	landscapeWidths,
	portraitCrops,
	portraitKey,
	thumbSmallWidth,
	variantFile,
	type ImageFormat
} from '../src/widgets/wallpaper/variants.ts';

// Качество подобрано на глаз по orcs-tavern: webp q80 и AVIF crf 30 от оригинала на глаз не отличить,
// при этом AVIF в 2–3 раза легче webp. cpu-used 4 — баланс времени кодирования и размера
const webpQuality = 80;
const avifCrf = 30;
const thumbQuality = 75;

const root = fileURLToPath(new URL('../src/assets/wallpapers/', import.meta.url));
const force = process.argv.includes('--force');

function run(command: string, args: string[]) {
	const result = spawnSync(command, args, { encoding: 'utf8' });
	if (result.error) throw new Error(`Не запустился ${command}: ${result.error.message}`);
	if (result.status !== 0) throw new Error(`${command}: ${result.stderr}`);
	return result.stdout;
}

function isFresh(target: string, source: string) {
	return !force && existsSync(target) && statSync(target).mtimeMs >= statSync(source).mtimeMs;
}

const encoders: Record<ImageFormat, string[]> = {
	webp: [
		'-c:v',
		'libwebp',
		'-quality',
		String(webpQuality),
		'-compression_level',
		'6',
		'-preset',
		'picture'
	],
	avif: [
		'-c:v',
		'libaom-av1',
		'-crf',
		String(avifCrf),
		'-cpu-used',
		'4',
		'-still-picture',
		'1',
		'-pix_fmt',
		'yuv420p'
	]
};

let created = 0;

function make(source: string, target: string, filter: string, format: ImageFormat) {
	if (isFresh(target, source)) return;
	run('ffmpeg', [
		'-v',
		'error',
		'-y',
		'-i',
		source,
		'-vf',
		filter,
		'-frames:v',
		'1',
		...encoders[format],
		target
	]);
	created++;
	console.log(`${basename(target)}: ${(statSync(target).size / 1024).toFixed(0)} КБ`);
}

function imageSize(path: string) {
	const out = run('ffprobe', [
		'-v',
		'error',
		'-select_streams',
		'v:0',
		'-show_entries',
		'stream=width,height',
		'-of',
		'csv=p=0',
		path
	]);
	const [width, height] = out.trim().split(',').map(Number);
	return { width, height };
}

const categories = readdirSync(root, { withFileTypes: true }).filter(
	(entry) => entry.isDirectory() && entry.name !== 'thumbs'
);

for (const category of categories) {
	const dir = join(root, category.name);
	const originals = readdirSync(dir).filter((f) => f.endsWith('.webp') && !isVariantFile(f));
	for (const file of originals) {
		const source = join(dir, file);
		const base = file.replace(/\.webp$/, '');
		const { width, height } = imageSize(source);
		if (width !== fullWidth || height !== fullHeight) {
			console.warn(
				`${category.name}/${file}: ${width}×${height}, а ожидается ${fullWidth}×${fullHeight}. Пропущен: поправь размер файла или fullWidth/fullHeight в variants.ts`
			);
			continue;
		}

		// По ширине. Оригинал остаётся как есть (webp), для него делаем только AVIF
		for (const format of formats) {
			for (const w of landscapeWidths) {
				make(source, join(dir, variantFile(base, w, format)), `scale=${w}:-2`, format);
			}
		}
		make(source, join(dir, variantFile(base, fullWidth, 'avif')), 'null', 'avif');

		// Портретные кропы по центру: ширина кропа считается от высоты оригинала
		for (const crop of portraitCrops) {
			const cropWidth = Math.round((fullHeight * crop.aspect) / 2) * 2;
			for (const w of crop.widths) {
				for (const format of formats) {
					const target = join(dir, variantFile(base, portraitKey(w), format));
					make(source, target, `crop=${cropWidth}:${fullHeight},scale=${w}:-2`, format);
				}
			}
		}
	}

	// Превью 240px из существующих 480px
	const thumbDir = join(root, 'thumbs', category.name);
	if (!existsSync(thumbDir)) continue;
	for (const file of readdirSync(thumbDir).filter(
		(f) => f.endsWith('.webp') && !isVariantFile(f)
	)) {
		const source = join(thumbDir, file);
		const base = file.replace(/\.webp$/, '');
		const target = join(thumbDir, variantFile(base, thumbSmallWidth, 'webp'));
		if (isFresh(target, source)) continue;
		run('ffmpeg', [
			'-v',
			'error',
			'-y',
			'-i',
			source,
			'-vf',
			`scale=${thumbSmallWidth}:-2`,
			'-frames:v',
			'1',
			'-c:v',
			'libwebp',
			'-quality',
			String(thumbQuality),
			target
		]);
		created++;
		console.log(
			`thumbs/${category.name}/${basename(target)}: ${(statSync(target).size / 1024).toFixed(1)} КБ`
		);
	}
}

console.log(created === 0 ? 'Все варианты уже готовы' : `Создано файлов: ${created}`);
