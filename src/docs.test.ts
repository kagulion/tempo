import { describe, expect, it } from 'vitest';

import { storageKeys } from '@/lib/storage';

// Проверка docs/: у каждого виджета есть свой файл, ссылки, пути к коду и ключи хранилища не битые.
// Файлы берём через import.meta.glob, а не node:fs: тесты в src типизированы под vite/client
const docs = import.meta.glob<string>(['/docs/*.md', '/README.md'], {
	query: '?raw',
	import: 'default',
	eager: true
});
const registry = import.meta.glob<string>('/src/widgets/registry.ts', {
	query: '?raw',
	import: 'default',
	eager: true
})['/src/widgets/registry.ts'];
// Без eager файлы не читаются: нужны только их пути. Себя glob не возвращает, поэтому этот файл добавлен вручную
const files = new Set([
	...Object.keys(
		import.meta.glob([
			'/src/**/*',
			'/scripts/**/*',
			'/supabase/**/*',
			'/public/**/*',
			'/.github/**/*',
			'/docs/*',
			'/*',
			'/.*'
		])
	),
	'/src/docs.test.ts'
]);
const dirs = new Set(
	[...files].flatMap((file) =>
		file
			.split('/')
			.slice(1, -1)
			.map((_, i, parts) => '/' + parts.slice(0, i + 1).join('/'))
	)
);

function exists(path: string) {
	const clean = path.replace(/\/$/, '');
	return files.has(clean) || dirs.has(clean);
}

// '/docs/a/../b.md' → '/docs/b.md'
function resolve(from: string, target: string) {
	const parts = from.split('/').slice(0, -1);
	for (const part of target.split('/')) {
		if (part === '..') parts.pop();
		else if (part !== '.') parts.push(part);
	}
	return parts.join('/');
}

// Якорь заголовка, как его строит GitHub
function slug(heading: string) {
	return heading
		.trim()
		.toLowerCase()
		.replace(/[^\p{L}\p{N}\s_-]/gu, '')
		.replace(/\s/g, '-');
}

function anchors(markdown: string) {
	return new Set(
		[...markdown.matchAll(/^#{1,6} (.+)$/gm)].map(([, heading]) => slug(heading.replace(/`/g, '')))
	);
}

describe('docs', () => {
	it('у каждого виджета из реестра есть docs/<id>.md', () => {
		const ids = [...registry.matchAll(/^\t\tid: '([\w-]+)'/gm)].map(([, id]) => id);
		expect(ids.length).toBeGreaterThan(0);
		expect(ids.filter((id) => !(`/docs/${id}.md` in docs))).toEqual([]);
	});

	it('относительные ссылки ведут на существующие файлы и заголовки', () => {
		const broken: string[] = [];
		for (const [file, markdown] of Object.entries(docs)) {
			for (const [, href] of markdown.matchAll(/\]\(([^)\s]+)\)/g)) {
				if (/^[a-z]+:/i.test(href)) continue;
				const [path, anchor] = href.split('#');
				const target = path ? resolve(file, decodeURI(path)) : file;
				if (!exists(target)) broken.push(`${file}: ${href}`);
				else if (
					anchor &&
					target.endsWith('.md') &&
					!anchors(docs[target] ?? '').has(decodeURI(anchor))
				)
					broken.push(`${file}: ${href} (нет заголовка)`);
			}
		}
		expect(broken).toEqual([]);
	});

	it('пути к коду в `кавычках` существуют', () => {
		const missing: string[] = [];
		for (const [file, markdown] of Object.entries(docs)) {
			for (const [, path] of markdown.matchAll(/`((?:src|scripts)\/[^`\s<>*]+)`/g)) {
				if (!exists('/' + path)) missing.push(`${file}: ${path}`);
			}
		}
		expect(missing).toEqual([]);
	});

	it('ключи tempo:* в доке совпадают с storageKeys', () => {
		// Не ключи хранилища: канал Supabase и ключ, от которого радио отказалось (описан как старый)
		const notKeys = new Set(['tempo:online', 'tempo:liked-stations']);
		const keys = new Set<string>(Object.values(storageKeys));
		const mentioned = new Set(
			Object.values(docs).flatMap((markdown) =>
				[...markdown.matchAll(/`(tempo:[a-z-]+)`/g)].map(([, key]) => key)
			)
		);
		expect([...mentioned].filter((key) => !keys.has(key) && !notKeys.has(key))).toEqual([]);
		expect([...keys].filter((key) => !mentioned.has(key))).toEqual([]);
	});
});
