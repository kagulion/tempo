import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Widget } from '@/widgets/Widget';

const buttonClass =
	'bg-white/10 px-3 text-sm font-medium text-white transition-colors hover:bg-white/20 hover:text-white';

type WallpaperSwitcherProps = {
	onPrev: () => void;
	onNext: () => void;
	className?: string;
};

export function WallpaperSwitcher({ onPrev, onNext, className }: WallpaperSwitcherProps) {
	return (
		<Widget aria-label="Обои" className={cn('flex items-center gap-2 p-3', className)}>
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
		</Widget>
	);
}
