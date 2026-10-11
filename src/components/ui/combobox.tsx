import { useRef } from 'react';
import { Combobox as ComboboxPrimitive } from '@base-ui/react/combobox';
import { CheckIcon, ChevronDownIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

type ComboboxProps<T> = {
	items: T[];
	value: T | null;
	onValueChange: (item: T) => void;
	getLabel: (item: T) => string;
	getKey: (item: T) => string;
	placeholder?: string;
	emptyText?: string;
	disabled?: boolean;
	className?: string;
	'aria-label'?: string;
};

// Комбобокс на Base UI в стиле стеклянной панели: поле с поиском и выпадающим списком
export function Combobox<T>({
	items,
	value,
	onValueChange,
	getLabel,
	getKey,
	placeholder,
	emptyText = 'Ничего не найдено',
	disabled,
	className,
	'aria-label': ariaLabel
}: ComboboxProps<T>) {
	const inputRef = useRef<HTMLInputElement>(null);

	return (
		<ComboboxPrimitive.Root
			items={items}
			value={value}
			onValueChange={(item) => {
				// Очистка поля даёт null — выбранное значение при этом не сбрасываем
				if (item !== null) onValueChange(item);
			}}
			itemToStringLabel={getLabel}
			itemToStringValue={getKey}
			isItemEqualToValue={(a, b) => getKey(a) === getKey(b)}
			openOnInputClick
			onOpenChange={(open, details) => {
				// При открытии кликом выделяем текст, чтобы запрос сразу печатался поверх названия.
				// При открытии вводом не выделяем — иначе следующая буква заменит предыдущую
				if (open && (details.reason === 'input-press' || details.reason === 'trigger-press')) {
					requestAnimationFrame(() => inputRef.current?.select());
				}
			}}
			disabled={disabled}
		>
			<div
				className={cn(
					'relative flex h-8 items-center rounded-lg border border-white/10 bg-white/10 text-sm text-white transition-colors hover:bg-white/20 has-focus-visible:ring-3 has-focus-visible:ring-white/20 has-disabled:opacity-50',
					className
				)}
			>
				<ComboboxPrimitive.Input
					ref={inputRef}
					aria-label={ariaLabel}
					placeholder={placeholder}
					className="h-full w-full min-w-0 truncate bg-transparent pr-8 pl-2.5 outline-none placeholder:text-white/50"
				/>
				<ComboboxPrimitive.Trigger
					aria-label="Открыть список"
					className="absolute top-1/2 right-1 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-white/70 hover:text-white"
				>
					<ChevronDownIcon className="size-4" />
				</ComboboxPrimitive.Trigger>
			</div>

			<ComboboxPrimitive.Portal>
				<ComboboxPrimitive.Positioner side="top" sideOffset={8} align="start" className="z-50">
					<ComboboxPrimitive.Popup className="w-(--anchor-width) max-w-(--available-width) min-w-56 origin-(--transform-origin) overflow-hidden rounded-xl border border-white/10 bg-neutral-900/90 text-sm text-white [color-scheme:dark] shadow-2xl backdrop-blur-md transition-[opacity,scale] duration-100 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
						<ComboboxPrimitive.Empty className="px-3 py-2 text-white/50 empty:hidden">
							{emptyText}
						</ComboboxPrimitive.Empty>
						<ComboboxPrimitive.List className="max-h-[min(18rem,var(--available-height))] scroll-py-1 overflow-y-auto overscroll-contain p-1 empty:p-0">
							{(item: T) => (
								<ComboboxPrimitive.Item
									key={getKey(item)}
									value={item}
									className="relative flex cursor-default items-center rounded-md py-1.5 pr-8 pl-2.5 outline-none select-none data-highlighted:bg-white/15"
								>
									<span className="truncate">{getLabel(item)}</span>
									<ComboboxPrimitive.ItemIndicator className="absolute right-2 flex size-4 items-center justify-center">
										<CheckIcon className="size-4" />
									</ComboboxPrimitive.ItemIndicator>
								</ComboboxPrimitive.Item>
							)}
						</ComboboxPrimitive.List>
					</ComboboxPrimitive.Popup>
				</ComboboxPrimitive.Positioner>
			</ComboboxPrimitive.Portal>
		</ComboboxPrimitive.Root>
	);
}
