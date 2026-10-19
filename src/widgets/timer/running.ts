// Идёт ли какой-нибудь таймер в сохранённом состоянии. Нужно при загрузке страницы, до загрузки окна таймера:
// идущему таймеру окно нужно и закрытым (сигнал, затихание музыки). Лёгкий модуль без React и без самого виджета
import { loadStored, isRecord, storageKeys } from '@/lib/storage';

export function anyTimerRunning(saved: unknown): boolean {
	return (
		isRecord(saved) &&
		Object.values(saved).some((run) => isRecord(run) && typeof run.startedAt === 'number')
	);
}

export function hasRunningTimer(): boolean {
	return loadStored<boolean>(storageKeys.timerRuns, false, anyTimerRunning);
}
