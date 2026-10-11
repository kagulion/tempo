import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [react(), tailwindcss()],
	// .jfif — это обычный JPEG, но Vite не знает расширение и без этого не отдаёт файл как картинку
	assetsInclude: ['**/*.jfif'],
	resolve: {
		alias: {
			'@': path.resolve(import.meta.dirname, './src')
		}
	}
});
