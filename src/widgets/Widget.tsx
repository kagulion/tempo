import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/lib/utils';

// Общая «стеклянная» оболочка виджетов. Положение на экране задаёт тот, кто размещает виджет
export function Widget({ className, ...props }: ComponentProps<'section'>) {
	return (
		<section
			className={cn(
				'z-10 rounded-2xl border border-white/10 bg-black/65 text-white shadow-2xl backdrop-blur-md',
				className
			)}
			{...props}
		/>
	);
}

// Мелкая подпись окна: «Звуки», «Таймер»
export function WidgetTitle({ className, ...props }: ComponentProps<'span'>) {
	return <span className={cn('text-xs font-medium text-white/80', className)} {...props} />;
}

type WidgetHeaderProps = {
	title: ReactNode;
	// Маленькие кнопки справа: Button variant="glass" size="icon-sm"
	children?: ReactNode;
};

// Шапка окна: подпись слева, кнопки справа. Отрицательный отступ съедает лишнюю высоту кнопок,
// чтобы шапка не раздвигала окно
export function WidgetHeader({ title, children }: WidgetHeaderProps) {
	return (
		<div className="-my-1 flex items-center gap-1">
			<WidgetTitle>{title}</WidgetTitle>
			{children && <div className="ml-auto flex items-center gap-1">{children}</div>}
		</div>
	);
}
