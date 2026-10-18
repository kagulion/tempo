// Чистая часть эквалайзера: уровни полосок по данным анализатора и признак «анализатор молчит».
// Сам анализатор и цикл кадров — в audioAnalyser.ts

// Диапазоны ячеек спектра (fftSize 256, ячейка ≈ 170–190 Гц) для каждой полоски: от баса к верхам.
// Нулевую ячейку (постоянная составляющая) пропускаем
export const barBands: ReadonlyArray<readonly [number, number]> = [
	[1, 2],
	[2, 6],
	[6, 16],
	[16, 40]
];

// Ниже полоска не опускается, чтобы на тихом звуке она оставалась видна
const minLevel = 0.2;

// Уровень каждой полоски от minLevel до 1 по байтам getByteFrequencyData
export function bandLevels(bytes: ArrayLike<number>): number[] {
	return barBands.map(([from, to]) => {
		const end = Math.min(to, bytes.length);
		if (end <= from) return minLevel;
		let sum = 0;
		for (let index = from; index < end; index++) sum += bytes[index];
		const average = sum / (end - from);
		return Math.min(1, Math.max(minLevel, average / 255));
	});
}

export function isSilentSpectrum(bytes: ArrayLike<number>) {
	for (let index = 0; index < bytes.length; index++) {
		if (bytes[index] > 0) return false;
	}
	return true;
}

// Сколько звук должен идти при нулевом спектре, прежде чем считаем анализатор неработающим
export const silenceTimeout = 3000;

// Копит время непрерывной тишины. now — текущее время, silent — спектр нулевой при слышимом звуке.
// Возвращает true, когда тишина длится дольше silenceTimeout
export function createSilenceWatch(timeout = silenceTimeout) {
	let since: number | null = null;
	return (now: number, silent: boolean) => {
		if (!silent) {
			since = null;
			return false;
		}
		since ??= now;
		return now - since >= timeout;
	};
}
