/// <reference types="vitest/config" />
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: {
			'@': path.resolve(import.meta.dirname, './src')
		}
	},
	// Тесты — для логики без интерфейса, рядом с кодом: phases.ts → phases.test.ts. Идут в Node, без браузера
	test: {
		include: ['src/**/*.test.ts']
	}
});
