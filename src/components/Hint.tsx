import type { ReactElement } from 'react';

import { useSiteHotkeys } from '@/lib/siteHotkeys';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type HintProps = {
	// Название действия
	label: string;
	// Клавиша действия, например «F» или «?»: показывается рядом с названием
	hotkey?: string;
	side?: 'top' | 'bottom' | 'left' | 'right';
	// Одна кнопка или другой элемент, на который вешается подсказка
	children: ReactElement;
};

// Клавиша в подсказке и в списке клавиш
export function Kbd({ children }: { children: string }) {
	return (
		<kbd className="inline-flex min-w-5 items-center justify-center rounded-md border border-white/15 bg-white/10 px-1.5 py-0.5 font-sans text-[0.7rem] leading-none font-medium text-white/90">
			{children}
		</kbd>
	);
}

// Красивая подсказка с названием и клавишей вместо стандартного title. Подсказка есть только у мыши:
// на телефоне наведения нет, поэтому у кнопки оставляем aria-label
export function Hint({ label, hotkey, side = 'top', children }: HintProps) {
	// Когда клавиши сайта выключены, их подсказки не нужны; Esc работает всегда
	const siteHotkeys = useSiteHotkeys().enabled;
	const shownHotkey = siteHotkeys || hotkey === 'Esc' ? hotkey : undefined;
	return (
		<Tooltip>
			<TooltipTrigger render={children} />
			<TooltipContent side={side}>
				{label}
				{shownHotkey && <Kbd>{shownHotkey}</Kbd>}
			</TooltipContent>
		</Tooltip>
	);
}
