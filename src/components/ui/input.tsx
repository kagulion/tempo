import { Input as InputPrimitive } from '@base-ui/react/input';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';
import type * as React from 'react';

const inputVariants = cva(
	'h-8 w-full min-w-0 rounded-lg border px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:ring-3 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40',
	{
		variants: {
			variant: {
				default:
					'border-input bg-transparent placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 disabled:bg-input/50 dark:bg-input/30 dark:disabled:bg-input/80',
				// Поле в стеклянных окнах виджетов, под стать Button variant="glass" и комбобоксу
				glass:
					'border-white/10 bg-white/10 text-white placeholder:text-white/90 hover:bg-white/20 focus-visible:border-white/20 focus-visible:ring-white/20'
			}
		},
		defaultVariants: {
			variant: 'default'
		}
	}
);

function Input({
	className,
	type,
	variant = 'default',
	...props
}: React.ComponentProps<'input'> & VariantProps<typeof inputVariants>) {
	return (
		<InputPrimitive
			type={type}
			data-slot="input"
			className={cn(inputVariants({ variant, className }))}
			{...props}
		/>
	);
}

export { Input, inputVariants };
