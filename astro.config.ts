import path from 'node:path';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// Статический сайт: Render раздаёт dist/, а public/404.html отдаёт для неизвестных путей
export default defineConfig({
	site: 'https://tempo-1qlr.onrender.com',
	output: 'static',
	outDir: 'dist',
	integrations: [react()],
	vite: {
		plugins: [tailwindcss()],
		resolve: {
			alias: {
				'@': path.resolve(import.meta.dirname, './src')
			}
		}
	}
});
