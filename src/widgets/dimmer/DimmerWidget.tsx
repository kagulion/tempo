import { RotateCcw, SunDim } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SettingSlider } from '@/widgets/timer/SettingSlider';
import { Widget, WidgetHeader } from '@/widgets/Widget';

import { dimmerDefault, dimmerMax, dimmerMin, dimmerStep } from './dimmer';
import { useDimmer } from './useDimmer';

type DimmerWidgetProps = {
	className?: string;
};

// Окно затемнения обоев: один ползунок, сверху сброс до 0
export function DimmerWidget({ className }: DimmerWidgetProps) {
	const { value, setValue } = useDimmer();

	return (
		<Widget aria-label="Затемнение" className={cn('flex flex-col gap-3 p-4', className)}>
			<WidgetHeader title="Затемнение">
				<Button
					variant="glass"
					size="icon-sm"
					onClick={() => setValue(dimmerDefault)}
					disabled={value === dimmerDefault}
					title="Убрать затемнение"
					aria-label="Убрать затемнение"
				>
					<RotateCcw />
				</Button>
			</WidgetHeader>

			<SettingSlider
				icon={SunDim}
				label="Затемнение"
				value={value}
				min={dimmerMin}
				max={dimmerMax}
				step={dimmerStep}
				format={(percent) => `${percent} %`}
				onValueChange={setValue}
			/>
		</Widget>
	);
}
