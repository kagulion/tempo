// Расписание опроса «что сейчас играет». Без React и сети: когда можно спрашивать прокси
// и как долго молчать после неудачи

// Как часто обновлять трек, пока радио играет
export const trackPollInterval = 20_000;
// После ошибки или пустого ответа (прокси не задеплоен, сеть упала) не спрашиваем так долго
export const trackFailureBackoff = 120_000;

export type TrackPollResult = {
	// Когда закончился последний запрос
	at: number;
	// Вернулись ли треки
	ok: boolean;
};

// Опрашиваем, только пока радио играет и вкладку видно
export function shouldPollTracks(playing: boolean, visible: boolean) {
	return playing && visible;
}

// Через сколько мс можно делать следующий запрос.
// immediate — повод спросить сразу (смена станции, возврат на вкладку): интервал пропускаем,
// но после неудачи пауза остаётся, чтобы не сыпать ошибками в консоль
export function trackPollDelay(now: number, last: TrackPollResult | null, immediate: boolean) {
	if (!last) return 0;
	if (!last.ok) return Math.max(0, last.at + trackFailureBackoff - now);
	if (immediate) return 0;
	return Math.max(0, last.at + trackPollInterval - now);
}
