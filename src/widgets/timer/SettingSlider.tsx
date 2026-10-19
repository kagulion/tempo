import { Slider as SliderPrimitive } from '@base-ui/react/slider';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

type SettingSliderProps = {
	icon: LucideIcon;
	label: string;
	value: number;
	min: number;
	max: number;
	step?: number;
	// Как показать значение справа, например «25 мин»
	format: (value: number) => string;
	onValueChange: (value: number) => void;
	className?: string;
};

// Строка настройки во всю ширину: заливка фона показывает значение, тянуть можно за любое место строки
export function SettingSlider({
	icon: Icon,
	label,
	value,
	min,
	max,
	step = 1,
	format,
	onValueChange,
	className
}: SettingSliderProps) {
	return (
		<SliderPrimitive.Root
			value={value}
			min={min}
			max={max}
			step={step}
			onValueChange={onValueChange}
			thumbAlignment="edge"
			className={cn('w-full', className)}
		>
			<SliderPrimitive.Control className="relative flex h-10 w-full cursor-ew-resize touch-none items-center select-none">
				<SliderPrimitive.Track className="h-full w-full overflow-hidden rounded-lg bg-white/5">
					<SliderPrimitive.Indicator className="h-full bg-white/15" />
				</SliderPrimitive.Track>
				{/* Ползунок виден только при управлении с клавиатуры: значение и так показывает заливка */}
				<SliderPrimitive.Thumb
					getAriaLabel={() => label}
					getAriaValueText={() => format(value)}
					className="h-6 w-0.5 rounded-full outline-none has-[:focus-visible]:bg-white"
				/>
				{/* Подписи поверх заливки не перехватывают перетаскивание */}
				<div className="pointer-events-none absolute inset-0 flex items-center gap-2 px-3 text-sm">
					<Icon className="size-4 shrink-0 text-white/80" />
					<span className="font-medium">{label}</span>
					<span className="ml-auto text-white/80 tabular-nums">{format(value)}</span>
				</div>
			</SliderPrimitive.Control>
		</SliderPrimitive.Root>
	);
}
