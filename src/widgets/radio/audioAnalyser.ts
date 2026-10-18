// Настоящий эквалайзер: один AnalyserNode на <audio> радио и один цикл кадров на все полоски
// (окно радио и строка под крупными часами). Цикл работает, только пока есть подписчики,
// то есть пока звук идёт, а полоски видны (за этим следит SoundBars).
//
// Звук идёт через граф: <audio> → AnalyserNode → выход AudioContext. Громкость, mute и приглушение
// (duckLevel) задают свойства самого <audio>, поэтому работают как раньше. Но после createMediaElementSource
// звук слышен, только пока контекст running, поэтому узел подключаем лишь когда контекст уже разблокирован
// кликом (unlockAudio при включении радио). До этого радио играет напрямую, а полоски — на CSS-анимации.
// Потоки Рекорда отдают CORS, поэтому у <audio> стоит crossOrigin="anonymous" (см. useRadio)
import { runningAudioContext } from '@/lib/audio';

import { bandLevels, createSilenceWatch, isSilentSpectrum } from './soundLevels';

// Получатель уровней. null — анализатор недоступен, полоскам нужна запасная CSS-анимация
export type LevelsListener = (levels: number[] | null) => void;

// Как часто проверяем, не разблокировался ли контекст, пока анализатора ещё нет
const retryDelay = 500;

let element: HTMLAudioElement | null = null;
const analysers = new WeakMap<HTMLAudioElement, AnalyserNode>();
// Элементы, у которых анализатор не заработал: не пробуем снова
const broken = new WeakSet<HTMLAudioElement>();
const guarded = new WeakSet<AudioContext>();
const listeners = new Set<LevelsListener>();

let frame = 0;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let silence = createSilenceWatch();
let bytes: Uint8Array<ArrayBuffer> | null = null;

// <audio> радио. Вызывает useRadio при монтировании
export function setLevelSource(audio: HTMLAudioElement | null) {
	element = audio;
}

// Если браузер приостановит контекст, звук через граф пропадёт, поэтому будим его обратно
function guardContext(context: AudioContext) {
	if (guarded.has(context)) return;
	guarded.add(context);
	context.addEventListener('statechange', () => {
		if (context.state !== 'running') context.resume().catch(() => {});
	});
}

function connect(audio: HTMLAudioElement) {
	const existing = analysers.get(audio);
	if (existing) return existing;
	const context = runningAudioContext();
	if (!context) return null;
	try {
		const source = context.createMediaElementSource(audio);
		const analyser = context.createAnalyser();
		analyser.fftSize = 256;
		analyser.smoothingTimeConstant = 0.7;
		source.connect(analyser);
		analyser.connect(context.destination);
		guardContext(context);
		analysers.set(audio, analyser);
		return analyser;
	} catch {
		broken.add(audio);
		return null;
	}
}

function emit(levels: number[] | null) {
	listeners.forEach((listener) => listener(levels));
}

function schedule() {
	frame = requestAnimationFrame(tick);
}

function tick() {
	frame = 0;
	if (listeners.size === 0) return;

	const audio = element;
	const analyser = audio && !broken.has(audio) ? connect(audio) : null;
	if (!audio || !analyser) {
		// Анализатора нет: полоски на CSS. Если дело в неразблокированном контексте, проверим ещё раз позже
		emit(null);
		if (audio && !broken.has(audio)) retryTimer = setTimeout(retry, retryDelay);
		return;
	}

	bytes ??= new Uint8Array(analyser.frequencyBinCount);
	analyser.getByteFrequencyData(bytes);
	// Нули при заглушенном или затихшем звуке — не поломка
	const heard = !audio.paused && !audio.muted && audio.volume > 0.05;
	if (silence(performance.now(), heard && isSilentSpectrum(bytes))) {
		broken.add(audio);
		emit(null);
		return;
	}
	emit(bandLevels(bytes));
	schedule();
}

function retry() {
	retryTimer = undefined;
	if (listeners.size > 0 && !frame) schedule();
}

// Подписка на уровни. Пока есть хотя бы один подписчик, крутится цикл кадров
export function subscribeLevels(listener: LevelsListener) {
	listeners.add(listener);
	if (listeners.size === 1) {
		silence = createSilenceWatch();
		if (!frame && retryTimer === undefined) schedule();
	}
	return () => {
		listeners.delete(listener);
		if (listeners.size > 0) return;
		cancelAnimationFrame(frame);
		frame = 0;
		clearTimeout(retryTimer);
		retryTimer = undefined;
	};
}
