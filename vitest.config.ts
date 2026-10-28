import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
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
