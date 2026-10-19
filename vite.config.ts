/// <reference types="vitest/config" />
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';

import { getSupabaseUrl } from './src/lib/supabase';

// Адрес Supabase берём из VITE_SUPABASE_URL тем же разбором, что и в приложении (там может лежать и один ref проекта),
// и прописываем в index.html preconnect: запрос станций и счётчик не тратят время на соединение. Нет адреса — тега нет
function supabasePreconnect(url: string | null): Plugin {
	return {
		name: 'supabase-preconnect',
		transformIndexHtml: () =>
			url
				? [
						{
							tag: 'link',
							attrs: { rel: 'preconnect', href: url, crossorigin: '' },
							injectTo: 'head-prepend'
						}
					]
				: []
	};
}

export default defineConfig(({ mode }) => ({
	plugins: [
		react(),
		tailwindcss(),
		supabasePreconnect(
			getSupabaseUrl(loadEnv(mode, import.meta.dirname, 'VITE_').VITE_SUPABASE_URL)
		)
	],
	resolve: {
		alias: {
			'@': path.resolve(import.meta.dirname, './src')
		}
	},
	// Тесты — для логики без интерфейса, рядом с кодом: phases.ts → phases.test.ts. Идут в Node, без браузера
	test: {
		include: ['src/**/*.test.ts']
	}
}));
