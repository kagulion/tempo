import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

// Подпись над значением в карточке: мелкие заглавные буквы
export function StatLabel({ children, className }: { children: ReactNode; className?: string }) {
	return (
		<span
			className={cn('text-[0.65rem] font-medium tracking-wide text-white/50 uppercase', className)}
		>
			{children}
		</span>
	);
}

// Значение счётчика: крупно и моноширинными цифрами, чтобы не прыгало при обновлении
export function StatValue({ children, className }: { children: ReactNode; className?: string }) {
	return (
		<span className={cn('flex items-center gap-1.5 text-lg font-semibold tabular-nums', className)}>
			{children}
		</span>
	);
}

// Внутренняя карточка окна статистики
export function StatCard({ children, className }: { children: ReactNode; className?: string }) {
	return (
		<div className={cn('rounded-xl border border-white/10 bg-white/5 px-3.5 py-3', className)}>
			{children}
		</div>
	);
}
