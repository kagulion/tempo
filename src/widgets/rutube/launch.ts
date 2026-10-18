// Запуск эфира Rutube. Встроенный плеер не стартует, пока пользователь не кликнет внутри iframe, а фон закрыт
// окнами. Поэтому на время запуска плеер поднимается поверх окон. Чистый модуль без React: его легко тестировать
//
// background — обычный фон под окнами (играет или ещё грузится);
// waiting    — эфир ждёт запуска, но поверх окон не лезет (обои восстановились после перезагрузки страницы);
// launch     — плеер поверх окон, пользователь жмёт Play

export type LaunchPhase = 'background' | 'waiting' | 'launch';

export type LaunchState = {
	phase: LaunchPhase;
	// Эфир уже начался хотя бы раз: после этого в запуск и ожидание не возвращаемся
	started: boolean;
};

export const initialLaunch: LaunchState = { phase: 'background', started: false };

export type LaunchEvent =
	// Плеер готов, но молчит: fresh — посетитель только что выбрал этот эфир (а не восстановил после перезагрузки)
	| { type: 'silent'; fresh: boolean }
	// Посетитель нажал Play в окне Rutube
	| { type: 'userStart' }
	// Эфир начался
	| { type: 'started' };

export function reduceLaunch(state: LaunchState, event: LaunchEvent): LaunchState {
	if (event.type === 'started') return { phase: 'background', started: true };
	if (state.started) return state;

	if (event.type === 'silent') {
		if (state.phase !== 'background') return state;
		return { ...state, phase: event.fresh ? 'launch' : 'waiting' };
	}
	// userStart
	return state.phase === 'launch' ? state : { ...state, phase: 'launch' };
}
