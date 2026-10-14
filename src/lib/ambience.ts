// Движок фоновых звуков на Web Audio. Каждый звук — бесконечная петля со своей громкостью,
// все вместе идут через общий регулятор. Петли AudioBufferSourceNode склеиваются без паузы на стыке,
// в отличие от <audio loop>. Состояние виджета — в src/widgets/ambience/useAmbience.ts.
// AudioContext общий для страницы (src/lib/audio.ts), разблокировать его по клику — unlockAudio

import { getAudioContext } from './audio';

export type NoiseColor = 'white' | 'pink' | 'brown';

// Откуда брать звук: файл из src/assets/ambience/ или шум, который генерируется прямо здесь
export type AmbienceSource = { kind: 'file'; url: string } | { kind: 'noise'; color: NoiseColor };

export type AmbienceStatus = 'loading' | 'error';

// Постоянная времени плавного включения и выключения, с. Звук почти полностью меняется за ~3 таких отрезка
const fade = 0.4;
// Через сколько мс после затухания останавливаем петлю, чтобы она не крутилась впустую
const stopDelay = fade * 5 * 1000;
// Длина сгенерированного шума, с. На стыке петли у шума шва не слышно
const noiseLength = 8;
// Хранилище скачанных файлов в Cache Storage. Сменить версию — значит выбросить всё старое разом
const cacheName = 'tempo-ambience-v1';

type Channel = {
	gain: GainNode;
	source?: AudioBufferSourceNode;
	loading: boolean;
	level: number;
	stopTimer?: ReturnType<typeof setTimeout>;
};

let master: GainNode | null = null;
let masterLevel = 1;

const channels = new Map<string, Channel>();
// Звук скачивается и раскодируется один раз — при первом включении
const buffers = new Map<string, Promise<AudioBuffer>>();

// Статусы звуков для интерфейса: что ещё грузится и что не удалось загрузить
let statuses: Record<string, AmbienceStatus> = {};
const listeners = new Set<() => void>();

function setStatus(id: string, status: AmbienceStatus | null) {
	const { [id]: _, ...rest } = statuses;
	statuses = status ? { ...rest, [id]: status } : rest;
	listeners.forEach((listener) => listener());
}

export function getStatuses() {
	return statuses;
}

export function subscribeStatuses(listener: () => void) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

// Общий AudioContext и регулятор громкости всех звуков. null — Web Audio недоступен
function audio() {
	const context = getAudioContext();
	if (!context) return null;
	if (!master) {
		master = context.createGain();
		master.gain.value = masterLevel;
		master.connect(context.destination);
	}
	return { context, master };
}

// Заполняет буфер шумом нужного цвета: белый — ровный, розовый — мягче, коричневый — глухой гул
function createNoise(ctx: AudioContext, color: NoiseColor) {
	const length = ctx.sampleRate * noiseLength;
	const buffer = ctx.createBuffer(2, length, ctx.sampleRate);

	for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
		const data = buffer.getChannelData(channel);
		// Состояние фильтров для розового (метод Пола Келлета) и коричневого шума
		let b0 = 0,
			b1 = 0,
			b2 = 0,
			b3 = 0,
			b4 = 0,
			b5 = 0,
			b6 = 0,
			last = 0;

		for (let i = 0; i < length; i++) {
			const white = Math.random() * 2 - 1;
			if (color === 'white') {
				data[i] = white * 0.25;
			} else if (color === 'pink') {
				b0 = 0.99886 * b0 + white * 0.0555179;
				b1 = 0.99332 * b1 + white * 0.0750759;
				b2 = 0.969 * b2 + white * 0.153852;
				b3 = 0.8665 * b3 + white * 0.3104856;
				b4 = 0.55 * b4 + white * 0.5329522;
				b5 = -0.7616 * b5 - white * 0.016898;
				data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
				b6 = white * 0.115926;
			} else {
				last = (last + 0.02 * white) / 1.02;
				data[i] = last * 2.5;
			}
		}
	}
	return buffer;
}

// Cache Storage есть только на https и localhost. В dev у файлов нет хэша в имени, и после замены
// файла играл бы старый звук — поэтому кэшируем только собранную версию
function soundCache() {
	if (import.meta.env.DEV || !('caches' in window)) return Promise.resolve(undefined);
	return caches.open(cacheName).catch(() => undefined);
}

// Скачанный файл кладём в Cache Storage: при следующих визитах звук берётся оттуда без сети
async function fetchSound(url: string) {
	const cache = await soundCache();
	const cached = await cache?.match(url);
	if (cached) return cached.arrayBuffer();

	const response = await fetch(url);
	if (!response.ok) throw new Error(`HTTP ${response.status}`);
	// Нет места или кэш недоступен — звук всё равно играет, просто скачается снова в следующий раз
	cache?.put(url, response.clone()).catch(() => {});
	return response.arrayBuffer();
}

// Удаляет из кэша файлы, которых больше нет в сборке: после замены звука у него меняется хэш в имени
export async function pruneSoundCache(urls: string[]) {
	const cache = await soundCache();
	if (!cache) return;
	const keep = new Set(urls.map((url) => new URL(url, location.href).href));
	const requests = await cache.keys();
	await Promise.all(
		requests.filter((request) => !keep.has(request.url)).map((request) => cache.delete(request))
	);
}

function loadBuffer(ctx: AudioContext, id: string, source: AmbienceSource) {
	let buffer = buffers.get(id);
	if (!buffer) {
		buffer =
			source.kind === 'noise'
				? Promise.resolve(createNoise(ctx, source.color))
				: fetchSound(source.url).then((data) => ctx.decodeAudioData(data));
		// Неудачную загрузку не кэшируем — при следующем включении попробуем снова
		buffer.catch(() => buffers.delete(id));
		buffers.set(id, buffer);
	}
	return buffer;
}

async function start(ctx: AudioContext, id: string, source: AmbienceSource, channel: Channel) {
	if (channel.source || channel.loading) return;

	channel.loading = true;
	setStatus(id, 'loading');
	try {
		const buffer = await loadBuffer(ctx, id, source);
		channel.loading = false;
		setStatus(id, null);
		// Пока грузилось, звук успели выключить
		if (channel.level === 0 || channel.source) return;

		const node = ctx.createBufferSource();
		node.buffer = buffer;
		node.loop = true;
		node.connect(channel.gain);
		// Начинаем с случайного места, чтобы после перезапуска петля не звучала одинаково
		node.start(0, Math.random() * buffer.duration);
		channel.source = node;
	} catch {
		channel.loading = false;
		setStatus(id, 'error');
	}
}

// Громкость одного звука от 0 до 1. 0 — звук плавно затихает и останавливается
export function setSoundLevel(id: string, source: AmbienceSource, level: number) {
	let channel = channels.get(id);
	// Пока звук ни разу не включали, AudioContext не создаём
	if (!channel && level === 0) return;
	const out = audio();
	// Web Audio недоступен — звуки просто не заиграют
	if (!out) return;
	const ctx = out.context;

	if (!channel) {
		const gain = ctx.createGain();
		gain.gain.value = 0;
		gain.connect(out.master);
		channel = { gain, loading: false, level: 0 };
		channels.set(id, channel);
	}

	channel.level = level;
	channel.gain.gain.setTargetAtTime(level, ctx.currentTime, fade);
	clearTimeout(channel.stopTimer);

	if (level > 0) {
		start(ctx, id, source, channel);
		return;
	}

	const stopping = channel;
	stopping.stopTimer = setTimeout(() => {
		if (stopping.level > 0) return;
		stopping.source?.stop();
		stopping.source?.disconnect();
		stopping.source = undefined;
	}, stopDelay);
}

// Общая громкость от 0 до 1. Меняется часто (приглушение под таймер), поэтому сглаживаем коротко
export function setAmbienceLevel(level: number) {
	masterLevel = level;
	if (!master) return;
	master.gain.setTargetAtTime(level, master.context.currentTime, 0.05);
}
