import { Slider as SliderPrimitive } from '@base-ui/react/slider';

import { cn } from '@/lib/utils';

// Слайдер base-nova на Base UI в стиле стеклянной панели (одно значение)
function Slider({ className, ...props }: SliderPrimitive.Root.Props<number>) {
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
					className="relative block size-3 shrink-0 rounded-full bg-white ring-white/30 transition-shadow select-none after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3"
				/>
			</SliderPrimitive.Control>
		</SliderPrimitive.Root>
	);
}

export { Slider };
