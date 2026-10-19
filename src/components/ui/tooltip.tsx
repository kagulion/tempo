import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip';
import { cn } from 'cn';
import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

function TooltipProvider({
	delay = 400,
	closeDelay = 0,
	...props
}: TooltipPrimitive.Provider.Props) {
	return (
		<TooltipPrimitive.Provider
			data-slot="tooltip-provider"
			delay={delay}
			closeDelay={closeDelay}
			{...props}
		/>
	);
}

// Открытая подсказка гасит Esc: Base UI останавливает событие и не даёт закрыться окну, внутри которого
// стоит кнопка (диалогу), а режиму фокуса приходится ждать второго Esc. Поэтому на Esc закрываем подсказку
// ещё до остальных слушателей (capture), сами событие не трогаем: окно или режим фокуса закроются с первого раза
function Tooltip({ onOpenChange, ...props }: TooltipPrimitive.Root.Props) {
	const [open, setOpen] = useState(false);

	useEffect(() => {
		if (!open) return;
		function onKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') flushSync(() => setOpen(false));
		}
		document.addEventListener('keydown', onKeyDown, true);
		return () => document.removeEventListener('keydown', onKeyDown, true);
	}, [open]);

	return (
		<TooltipPrimitive.Root
			data-slot="tooltip"
			open={open}
			onOpenChange={(next, details) => {
				setOpen(next);
				onOpenChange?.(next, details);
			}}
			{...props}
		/>
	);
}

function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
	return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

// Подсказка в стиле стеклянных окон сайта, без стрелки
function TooltipContent({
	className,
	side = 'top',
	sideOffset = 8,
	align = 'center',
	alignOffset = 0,
	children,
	...props
}: TooltipPrimitive.Popup.Props &
	Pick<TooltipPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset'>) {
	return (
		<TooltipPrimitive.Portal>
			<TooltipPrimitive.Positioner
				align={align}
				alignOffset={alignOffset}
				side={side}
				sideOffset={sideOffset}
				className="isolate z-50"
			>
				<TooltipPrimitive.Popup
					data-slot="tooltip-content"
					className={cn(
						'pointer-events-none z-50 inline-flex w-fit max-w-xs origin-(--transform-origin) items-center gap-2 rounded-lg border border-white/10 bg-neutral-900/90 px-2.5 py-1.5 text-xs text-white shadow-2xl backdrop-blur-md duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
						className
					)}
					{...props}
				>
					{children}
				</TooltipPrimitive.Popup>
			</TooltipPrimitive.Positioner>
		</TooltipPrimitive.Portal>
	);
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
