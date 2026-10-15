import type { Parse } from '@/lib/storage';

// Затемнение обоев, в процентах: 0 — обои как есть
export const dimmerMin = 0;
// Не 100: при полной черноте обои не видно и непонятно, что страница работает
export const dimmerMax = 90;
export const dimmerStep = 5;
export const dimmerDefault = 0;

// Принимает только конечное число в диапазоне и округляет его до шага
export const parseDimmer: Parse<number> = (saved) => {
	if (typeof saved !== 'number' || !Number.isFinite(saved)) return undefined;
	if (saved < dimmerMin || saved > dimmerMax) return undefined;
	return Math.round(saved / dimmerStep) * dimmerStep;
};

// Процент затемнения в прозрачность чёрного слоя (0–1)
export function dimmerOpacity(percent: number): number {
	return percent / 100;
}
