// Один AudioContext на всю страницу: его используют звуки (src/lib/ambience.ts) и сигнал таймера.
// Браузеры ограничивают число контекстов, а Safari разрешает звук только тому, что «разблокирован» кликом

let context: AudioContext | null = null;

// Audio Session API (Safari 16.4+): в типах TypeScript его пока нет
type AudioSessionNavigator = Navigator & { audioSession?: { type: string } };

// Контекст, создаётся при первом обращении. null — Web Audio недоступен
export function getAudioContext() {
	if (!context) {
		try {
			context = new AudioContext();
		} catch {
			return null;
		}
		// Без этого беззвучный режим iPhone глушит Web Audio, хотя <audio> продолжает играть
		try {
			if ('audioSession' in navigator)
				(navigator as AudioSessionNavigator).audioSession!.type = 'playback';
		} catch {
			// Не вышло — звук просто подчинится беззвучному режиму
		}
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
