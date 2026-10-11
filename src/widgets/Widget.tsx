import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

// Общая «стеклянная» оболочка виджетов. Положение на экране задаёт тот, кто размещает виджет
export function Widget({ className, ...props }: ComponentProps<'section'>) {
	return (
		<section
			className={cn(
				'z-10 rounded-2xl border border-white/10 bg-black/50 text-white shadow-2xl backdrop-blur-md',
				className
			)}
			{...props}
		/>
	);
}
