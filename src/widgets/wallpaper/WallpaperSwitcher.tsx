import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Widget } from '@/widgets/Widget';

import { type Faction, factions } from './wallpapers';

const buttonClass =
	'bg-white/10 px-3 text-sm font-medium text-white transition-colors hover:bg-white/20 hover:text-white';

type WallpaperSwitcherProps = {
	faction: Faction;
	index: number;
	count: number;
	onFactionChange: (faction: Faction) => void;
	onPrev: () => void;
	onNext: () => void;
	className?: string;
};

export function WallpaperSwitcher({
	faction,
	index,
	count,
	onFactionChange,
	onPrev,
	onNext,
	className
}: WallpaperSwitcherProps) {
	return (
		<Widget aria-label="Обои" className={cn('flex flex-col gap-2 p-3', className)}>
			<Tabs value={faction} onValueChange={(value: Faction) => onFactionChange(value)}>
				<TabsList aria-label="Фракция">
					{factions.map((item) => (
						<TabsTrigger key={item.value} value={item.value}>
							{item.label}
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>

			<div className="flex items-center justify-between gap-2">
				<Button
					variant="ghost"
					size="icon-lg"
					onClick={onPrev}
					title="Предыдущий фон"
					aria-label="Предыдущий фон"
					className={buttonClass}
				>
					<ChevronLeft />
				</Button>
				<span className="text-xs font-medium text-white/60 tabular-nums" aria-live="polite">
					{index + 1} / {count}
				</span>
				<Button
					variant="ghost"
					size="icon-lg"
					onClick={onNext}
					title="Следующий фон"
					aria-label="Следующий фон"
					className={buttonClass}
				>
					<ChevronRight />
				</Button>
			</div>
		</Widget>
	);
}
