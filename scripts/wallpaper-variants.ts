// Делает варианты обоев-картинок и превью: pnpm wallpaper:variants [--force]
// Нужен ffmpeg в PATH (с libwebp и libaom-av1). Оригиналы не меняются, файлы лежат рядом с ними:
//   src/assets/wallpapers/<категория>/<имя>.webp            оригинал 2752×1536
//   .../<имя>.1280.webp|avif, .1920.webp|avif, .2752.avif   по ширине
//   .../<имя>.p576|p864|p1152.webp|avif                     портретные кропы по центру
//   .../thumbs/<категория>/<имя>.240.webp                   превью 240px (480px — существующие файлы)
// Видео: рядом с каждым <имя>.mp4 (H.264 1080p, не меняется) появляются
//   <имя>.av1.mp4, <имя>.h264.mp4        основной AV1 и запасной H.264, 1080p
//   <имя>.p.av1.mp4, <имя>.p.h264.mp4    портретный кроп 9:16 по центру, 540×960, для узких экранов
// Готовые файлы пропускаются, если они новее оригинала. --force пересоздаёт всё, --redo=h264 — только файлы одного кодека
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
	videoFile,
	type ImageFormat
} from '../src/widgets/wallpaper/variants.ts';

// Качество подобрано на глаз по orcs-tavern: webp q80 и AVIF crf 30 от оригинала на глаз не отличить,
// при этом AVIF в 2–3 раза легче webp. cpu-used 4 — баланс времени кодирования и размера
const webpQuality = 80;
const avifCrf = 30;
const thumbQuality = 75;

const root = fileURLToPath(new URL('../src/assets/wallpapers/', import.meta.url));
const force = process.argv.includes('--force');
// --redo=h264 пересоздаёт только файлы этого кодека (долго кодировать AV1 заново незачем)
const redo = process.argv.find((arg) => arg.startsWith('--redo='))?.slice('--redo='.length);

function run(command: string, args: string[]) {
	const result = spawnSync(command, args, { encoding: 'utf8' });
	if (result.error) throw new Error(`Не запустился ${command}: ${result.error.message}`);
	if (result.status !== 0) throw new Error(`${command}: ${result.stderr}`);
	return result.stdout;
}

function isFresh(target: string, source: string) {
	return (
		!force &&
		!(redo && target.includes(`.${redo}.`)) &&
		existsSync(target) &&
		statSync(target).mtimeMs >= statSync(source).mtimeMs
	);
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

// Видео. AV1 (SVT-AV1) 10 бит: без бэндинга на тёмных градиентах. crf 44 на глаз не отличим от оригинала на 1:1 (ночной эльф, самый
// детальный кадр), файл в 3 раза легче. Фон показывается за стеклянными окнами, поэтому качества хватает с запасом.
// H.264 запасной: для браузеров без AV1 и без аппаратного декодера. Кадров больше 30 в секунду режем до 30 (sakura: 60)
const av1Crf = 44;
const h264Crf = 28;
const portraitFilter = 'crop=608:1080,scale=540:960';

function videoInfo(path: string) {
	const out = run('ffprobe', [
		'-v',
		'error',
		'-select_streams',
		'v:0',
		'-show_entries',
		'stream=width,height,r_frame_rate:format=duration',
		'-of',
		'json',
		path
	]);
	const data = JSON.parse(out) as {
		streams: { width: number; height: number; r_frame_rate: string }[];
		format: { duration: string };
	};
	const [num, den] = data.streams[0].r_frame_rate.split('/').map(Number);
	return {
		width: data.streams[0].width,
		height: data.streams[0].height,
		fps: num / den,
		duration: Number(data.format.duration)
	};
}

function makeVideo(
	source: string,
	target: string,
	filters: string[],
	codec: 'av1' | 'h264',
	portrait: boolean
) {
	if (isFresh(target, source)) return;
	const codecArgs =
		codec === 'av1'
			? [
					'-c:v',
					'libsvtav1',
					'-preset',
					'6',
					'-crf',
					String(av1Crf),
					'-pix_fmt',
					'yuv420p10le',
					'-g',
					'240',
					'-svtav1-params',
					'film-grain-denoise=0:tune=0'
				]
			: [
					'-c:v',
					'libx264',
					'-preset',
					'slow',
					'-crf',
					String(h264Crf),
					'-maxrate',
					portrait ? '1200k' : '2500k',
					'-bufsize',
					portrait ? '2400k' : '5M',
					'-profile:v',
					'high',
					// Уровень 4.0 (1080p30) совпадает со строкой кодека avc1.640028 в variants.ts
					'-level:v',
					'4.0',
					'-pix_fmt',
					'yuv420p'
				];
	const args = ['-v', 'error', '-y', '-i', source, '-an'];
	if (filters.length > 0) args.push('-vf', filters.join(','));
	args.push(...codecArgs, '-movflags', '+faststart', target);
	run('ffmpeg', args);
	created++;
	const bytes = statSync(target).size;
	console.log(`${basename(target)}: ${(bytes / 1024 / 1024).toFixed(2)} МБ`);
}

for (const category of categories) {
	const dir = join(root, category.name);
	for (const file of readdirSync(dir).filter((f) => f.endsWith('.mp4') && !isVariantFile(f))) {
		const source = join(dir, file);
		const base = file.replace(/\.mp4$/, '');
		const info = videoInfo(source);
		// Больше 30 к/с не нужно: на фоне разницы не видно, а байт больше
		const fps = info.fps > 30.5 ? ['fps=30'] : [];
		for (const codec of ['av1', 'h264'] as const) {
			makeVideo(source, join(dir, videoFile(base, codec)), fps, codec, false);
			makeVideo(
				source,
				join(dir, videoFile(base, codec, true)),
				[...fps, portraitFilter],
				codec,
				true
			);
		}
	}
}

console.log(created === 0 ? 'Все варианты уже готовы' : `Создано файлов: ${created}`);
