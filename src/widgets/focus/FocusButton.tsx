import { ChevronDown, Focus } from 'lucide-react';

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import type { FocusMode } from './focus';

type FocusButtonProps = {
	mode: FocusMode;
	onToggle: () => void;
	onHideAll: () => void;
	className?: string;
};

const partClass =
	'flex h-full items-center justify-center text-white/70 transition-colors outline-none hover:bg-white/15 hover:text-white focus-visible:ring-3 focus-visible:ring-white/20';

// Разделённая стеклянная кнопка: слева включает и выключает фокус (остаются только часы), справа шеврон с меню «Скрыть всё».
// Пока фокус включён, шеврона нет: остаётся одна кнопка выхода. Место на экране приходит в className
export function FocusButton({ mode, onToggle, onHideAll, className }: FocusButtonProps) {
	const active = mode !== 'off';
	const label = active ? 'Выйти из фокуса' : 'Фокус';

	return (
		<div
			className={cn(
				'flex h-9 items-center overflow-hidden rounded-full border border-white/10 bg-black/50 shadow-2xl backdrop-blur-md',
				className
			)}
		>
			<button
				type="button"
				onClick={onToggle}
				aria-pressed={active}
				title={label}
				aria-label={label}
				className={cn(partClass, 'gap-1.5 pl-3 text-sm', active ? 'pr-3.5' : 'pr-2')}
			>
				<Focus className="size-4" />
				Фокус
			</button>
			{!active && (
				<DropdownMenu>
					<DropdownMenuTrigger
						aria-label="Другие режимы фокуса"
						title="Другие режимы фокуса"
						className={cn(partClass, 'w-8 pr-1')}
					>
						<ChevronDown className="size-4" />
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={onHideAll}>Скрыть всё</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			)}
		</div>
	);
}
