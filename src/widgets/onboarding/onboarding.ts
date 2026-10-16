// Когда показывать первый экран со сценами. Без React, чтобы можно было тестировать

// pending — карточку ещё не закрывали, done — закрыта навсегда
export type OnboardingState = 'pending' | 'done';

export function parseOnboarding(saved: unknown): OnboardingState | undefined {
	return saved === 'pending' || saved === 'done' ? saved : undefined;
}

// Решение при первом заходе, когда флага ещё нет: новому посетителю показываем сцены,
// а тому, у кого уже есть любые сохранённые настройки tempo:*, — нет, считаем его прошедшим
export function initialOnboarding(storedKeys: readonly string[], ownKey: string): OnboardingState {
	const hasSettings = storedKeys.some((key) => key.startsWith('tempo:') && key !== ownKey);
	return hasSettings ? 'done' : 'pending';
}
