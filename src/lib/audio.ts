// Один AudioContext на всю страницу: его используют звуки (src/lib/ambience.ts) и сигнал таймера.
// Браузеры ограничивают число контекстов, а Safari разрешает звук только тому, что «разблокирован» кликом

let context: AudioContext | null = null;

// Контекст, создаётся при первом обращении. null — Web Audio недоступен
export function getAudioContext() {
	try {
		context ??= new AudioContext();
	} catch {
		return null;
	}
	return context;
}

// Контекст, только если его уже разблокировали кликом. Без клика звук всё равно не заиграет,
// а создавать контекст зря нельзя: браузер ругается в консоли
export function runningAudioContext() {
	return context?.state === 'running' ? context : null;
}

// Вызывать прямо в обработчике клика: Safari разрешает звук только внутри него
export function unlockAudio() {
	getAudioContext()
		?.resume()
		.catch(() => {});
}
