import { Slider as SliderPrimitive } from '@base-ui/react/slider';

import { cn } from '@/lib/utils';

type SliderProps = SliderPrimitive.Root.Props<number> & {
	// Доступное имя ползунка, например «Громкость радио»
	label: string;
	// Текст значения для скринридера; по умолчанию доля диапазона в процентах («75 %»)
	formatValue?: (value: number) => string;
};

// Слайдер base-nova на Base UI в стиле стеклянной панели (одно значение)
function Slider({ className, label, formatValue, ...props }: SliderProps) {
	const { min = 0, max = 100 } = props;
	const valueText = (value: number) =>
		formatValue ? formatValue(value) : `${Math.round(((value - min) / (max - min)) * 100)} %`;

	return (
		<SliderPrimitive.Root
			data-slot="slider"
			thumbAlignment="edge"
			className={cn('w-full', className)}
			{...props}
		>
			<SliderPrimitive.Control className="relative flex h-5 w-full touch-none items-center select-none data-disabled:opacity-50">
				<SliderPrimitive.Track
					data-slot="slider-track"
					className="relative h-1 w-full grow overflow-hidden rounded-full bg-white/20 select-none"
				>
					<SliderPrimitive.Indicator
						data-slot="slider-range"
						className="h-full bg-white select-none"
					/>
				</SliderPrimitive.Track>
				<SliderPrimitive.Thumb
					data-slot="slider-thumb"
					getAriaLabel={() => label}
					getAriaValueText={(_formatted, value) => valueText(value)}
					className="relative block size-3 shrink-0 rounded-full bg-white ring-white/30 transition-shadow select-none after:absolute after:-inset-2 hover:ring-3 active:ring-3 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-white"
				/>
			</SliderPrimitive.Control>
		</SliderPrimitive.Root>
	);
}

export { Slider };
