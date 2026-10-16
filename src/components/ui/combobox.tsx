import { useRef, type ReactNode } from 'react';
import { Combobox as ComboboxPrimitive } from '@base-ui/react/combobox';
import { CheckIcon, ChevronDownIcon, SearchIcon } from 'lucide-react';

import { Hint } from '@/components/Hint';
import { cn } from '@/lib/utils';

const popupClassName =
	'max-w-(--available-width) origin-(--transform-origin) overflow-hidden rounded-xl border border-white/10 bg-neutral-900/90 text-sm text-white [color-scheme:dark] shadow-2xl backdrop-blur-md transition-[opacity,scale] duration-100 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0';

type ComboboxItemsProps<T> = {
	emptyText: string;
	getLabel: (item: T) => string;
	getKey: (item: T) => string;
	getHint?: (item: T) => string;
};

// Общее содержимое выпадающего списка: пустое состояние и пункты с отметкой выбранного
function ComboboxItems<T>({ emptyText, getLabel, getKey, getHint }: ComboboxItemsProps<T>) {
	return (
		<>
			<ComboboxPrimitive.Empty className="px-3 py-2 text-white/50 empty:hidden">
				{emptyText}
			</ComboboxPrimitive.Empty>
			<ComboboxPrimitive.List className="max-h-[min(18rem,var(--available-height))] scroll-py-1 overflow-y-auto overscroll-contain p-1 empty:p-0">
				{(item: T) => (
					<ComboboxPrimitive.Item
						key={getKey(item)}
						value={item}
						className="relative flex cursor-pointer items-center gap-2 rounded-md py-1.5 pr-8 pl-2.5 outline-none select-none data-highlighted:bg-white/15"
					>
						<span className="truncate">{getLabel(item)}</span>
						{getHint && (
							<span className="ml-auto max-w-[55%] truncate text-xs text-white/50">
								{getHint(item)}
							</span>
						)}
						<ComboboxPrimitive.ItemIndicator className="absolute right-2 flex size-4 items-center justify-center">
							<CheckIcon className="size-4" />
						</ComboboxPrimitive.ItemIndicator>
					</ComboboxPrimitive.Item>
				)}
			</ComboboxPrimitive.List>
		</>
	);
}

type ComboboxProps<T> = {
	items: T[];
	value: T | null;
	onValueChange: (item: T) => void;
	getLabel: (item: T) => string;
	getKey: (item: T) => string;
	getHint?: (item: T) => string;
	placeholder?: string;
	emptyText?: string;
	// Поиск на стороне сервера: список не фильтруется по тексту сам, а набранный текст уходит сюда
	onSearch?: (text: string) => void;
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
	getHint,
	placeholder,
	emptyText = 'Ничего не найдено',
	onSearch,
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
			filter={onSearch ? null : undefined}
			onInputValueChange={(text, details) => {
				// Только ввод пользователя: подстановка названия выбранной станции запросом не считается
				if (onSearch && details.reason === 'input-change') onSearch(text);
			}}
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
					<ComboboxPrimitive.Popup
						className={cn(popupClassName, 'w-(--anchor-width)', getHint ? 'min-w-80' : 'min-w-56')}
					>
						<ComboboxItems
							emptyText={emptyText}
							getLabel={getLabel}
							getKey={getKey}
							getHint={getHint}
						/>
					</ComboboxPrimitive.Popup>
				</ComboboxPrimitive.Positioner>
			</ComboboxPrimitive.Portal>
		</ComboboxPrimitive.Root>
	);
}

type ComboboxButtonProps<T> = {
	items: T[];
	value: T | null;
	onValueChange: (item: T) => void;
	getLabel: (item: T) => string;
	getKey: (item: T) => string;
	getHint?: (item: T) => string;
	children: ReactNode;
	searchPlaceholder?: string;
	emptyText?: string;
	disabled?: boolean;
	className?: string;
	// Подсказка при наведении, она же aria-label
	hint?: string;
	'aria-label'?: string;
};

// Комбобокс за кнопкой: список открывается по нажатию, поле поиска находится внутри попапа
export function ComboboxButton<T>({
	items,
	value,
	onValueChange,
	getLabel,
	getKey,
	getHint,
	children,
	searchPlaceholder = 'Поиск',
	emptyText = 'Ничего не найдено',
	disabled,
	className,
	hint,
	'aria-label': ariaLabel
}: ComboboxButtonProps<T>) {
	return (
		<ComboboxPrimitive.Root
			items={items}
			value={value}
			onValueChange={(item) => {
				if (item !== null) onValueChange(item);
			}}
			itemToStringLabel={getLabel}
			itemToStringValue={getKey}
			isItemEqualToValue={(a, b) => getKey(a) === getKey(b)}
			disabled={disabled}
		>
			{hint ? (
				<Hint label={hint}>
					<ComboboxPrimitive.Trigger aria-label={ariaLabel ?? hint} className={className}>
						{children}
					</ComboboxPrimitive.Trigger>
				</Hint>
			) : (
				<ComboboxPrimitive.Trigger aria-label={ariaLabel} className={className}>
					{children}
				</ComboboxPrimitive.Trigger>
			)}

			<ComboboxPrimitive.Portal>
				<ComboboxPrimitive.Positioner side="top" sideOffset={8} align="end" className="z-50">
					<ComboboxPrimitive.Popup className={cn(popupClassName, 'w-72')}>
						<div className="flex items-center gap-2 border-b border-white/10 px-2.5">
							<SearchIcon className="size-4 shrink-0 text-white/50" />
							<ComboboxPrimitive.Input
								placeholder={searchPlaceholder}
								className="h-9 w-full min-w-0 bg-transparent outline-none placeholder:text-white/50"
							/>
						</div>
						<ComboboxItems
							emptyText={emptyText}
							getLabel={getLabel}
							getKey={getKey}
							getHint={getHint}
						/>
					</ComboboxPrimitive.Popup>
				</ComboboxPrimitive.Positioner>
			</ComboboxPrimitive.Portal>
		</ComboboxPrimitive.Root>
	);
}
