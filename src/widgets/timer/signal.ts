// Сигнал о конце фазы: звук через Web Audio (без файлов) и системное уведомление

let context: AudioContext | null = null;

// Вызывать по клику: браузер разрешает звук только после взаимодействия со страницей
export function unlockSound() {
	try {
		context ??= new AudioContext();
		context.resume().catch(() => {});
	} catch {
		// Web Audio недоступен — таймер работает без звука
	}
}

// Сколько мс звучит колокольчик: последняя нота начинается через 0,36 с и гаснет за 1,2 с
export const chimeLength = 1600;

// Короткий колокольчик из трёх нот поверх любого другого звука на странице
export function playChime() {
	if (!context) return;
	const start = context.currentTime;
	[880, 1108.73, 1318.51].forEach((frequency, index) => {
		const oscillator = context!.createOscillator();
		const gain = context!.createGain();
		const at = start + index * 0.18;

		oscillator.type = 'sine';
		oscillator.frequency.value = frequency;
		gain.gain.setValueAtTime(0, at);
		gain.gain.linearRampToValueAtTime(0.3, at + 0.02);
		gain.gain.exponentialRampToValueAtTime(0.001, at + 1.2);

		oscillator.connect(gain).connect(context!.destination);
		oscillator.start(at);
		oscillator.stop(at + 1.2);
	});
}

// Спрашиваем разрешение один раз, по нажатию «Start»
export function requestNotifications() {
	if (!('Notification' in window) || Notification.permission !== 'default') return;
	Notification.requestPermission().catch(() => {});
}

// Уведомление нужно, только когда вкладку не видно: иначе хватает звука и самого виджета
export function notify(title: string, body: string) {
	if (!('Notification' in window) || Notification.permission !== 'granted' || !document.hidden) {
		return;
	}
	try {
		new Notification(title, { body, icon: '/favicon.svg', tag: 'tempo-timer' });
	} catch {
		// Некоторые мобильные браузеры не дают создавать уведомления без service worker
	}
}
