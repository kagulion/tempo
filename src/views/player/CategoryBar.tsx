import { EllipsisVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import {
	useEffect,
	useRef,
	useState,
	type DragEvent,
	type FormEvent,
	type KeyboardEvent,
	type ReactNode
} from 'react';

import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import { categoryLimit, categoryNameMax, discDragType, type Category } from './categories';
import { createCategory, deleteCategory, renameCategoryById } from './useCategories';

type CategoryBarProps = {
	categories: Category[];
	// Выбранная вкладка: undefined — «Все»
	selectedId: string | undefined;
	onSelect: (id: string | undefined) => void;
	// Пластинку бросили на вкладку (categoryId undefined — на «Все»)
	onDropDisc: (discId: string, categoryId: string | undefined) => void;
};

type ChipProps = {
	selected: boolean;
	onDropDisc: (discId: string) => void;
	children: ReactNode;
};

// Оболочка вкладки: фон, выбранное состояние и приём перетаскиваемой плитки. Внутри обычные кнопки
function Chip({ selected, onDropDisc, children }: ChipProps) {
	const [over, setOver] = useState(false);

	function accepts(event: DragEvent) {
		return event.dataTransfer.types.includes(discDragType);
	}

	return (
		<div
			onDragEnter={(event) => {
				if (accepts(event)) setOver(true);
			}}
			onDragOver={(event) => {
				if (!accepts(event)) return;
				// Без preventDefault браузер не разрешит бросить
				event.preventDefault();
				event.dataTransfer.dropEffect = 'move';
				setOver(true);
			}}
			onDragLeave={(event) => {
				// dragleave приходит и при переходе на вложенную кнопку: туда курсор ушёл не с вкладки
				if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOver(false);
			}}
			onDrop={(event) => {
				setOver(false);
				const discId = event.dataTransfer.getData(discDragType);
				if (!discId) return;
				event.preventDefault();
				onDropDisc(discId);
			}}
			className={cn(
				'inline-flex h-8 max-w-full items-center rounded-full bg-white/10 transition-colors',
				selected && 'bg-white/20 ring-1 ring-white/40',
				over && 'bg-white/30 ring-2 ring-white/70'
			)}
		>
			{children}
		</div>
	);
}

type NameFormProps = {
	initial: string;
	label: string;
	// Вернуть текст ошибки или undefined, если название принято
	onSubmit: (name: string) => string | undefined;
	onCancel: () => void;
	onError: (message: string | undefined) => void;
};

// Поле названия вместо вкладки: Enter сохраняет, Esc отменяет, уход из поля сохраняет, если название изменили
function NameForm({ initial, label, onSubmit, onCancel, onError }: NameFormProps) {
	const [value, setValue] = useState(initial);
	const inputRef = useRef<HTMLInputElement>(null);

	// Меню, из которого открыли переименование, закрываясь, может забрать фокус: ставим его на следующем кадре
	useEffect(() => {
		const frame = requestAnimationFrame(() => {
			inputRef.current?.focus();
			inputRef.current?.select();
		});
		return () => cancelAnimationFrame(frame);
	}, []);

	function commit() {
		const error = onSubmit(value);
		onError(error);
	}

	function submit(event: FormEvent) {
		event.preventDefault();
		commit();
	}

	function keyDown(event: KeyboardEvent) {
		if (event.key !== 'Escape') return;
		event.stopPropagation();
		onError(undefined);
		onCancel();
	}

	return (
		<form onSubmit={submit} className="inline-flex min-w-0 items-center" noValidate>
			<Input
				ref={inputRef}
				variant="glass"
				type="text"
				value={value}
				onChange={(event) => {
					setValue(event.target.value);
					onError(undefined);
				}}
				onKeyDown={keyDown}
				onBlur={() => {
					// Пусто или без изменений — просто закрываем поле
					if (value.trim() === '' || value.trim() === initial) {
						onError(undefined);
						onCancel();
						return;
					}
					commit();
				}}
				maxLength={categoryNameMax}
				placeholder="Название"
				aria-label={label}
				autoComplete="off"
				spellCheck={false}
				className="h-8 w-40 rounded-full px-3"
			/>
		</form>
	);
}

// Ряд вкладок над сеткой: «Все», категории, «+». Вкладки переносятся на новую строку, а не прячутся за прокруткой,
// чтобы на каждую можно было бросить плитку. Выбранная вкладка фильтрует сетку
export function CategoryBar({ categories, selectedId, onSelect, onDropDisc }: CategoryBarProps) {
	// Что редактируется: id категории (переименование), 'new' (создание) или ничего
	const [editing, setEditing] = useState<string | 'new'>();
	const [error, setError] = useState<string>();
	const atLimit = categories.length >= categoryLimit;

	function stopEditing() {
		setEditing(undefined);
	}

	return (
		<div className="flex shrink-0 flex-col gap-1.5">
			<div
				role="group"
				aria-label="Категории"
				className="flex max-h-[6.5rem] scrollbar-glass flex-wrap items-center gap-1.5 overflow-y-auto"
			>
				<Chip
					selected={selectedId === undefined}
					onDropDisc={(discId) => onDropDisc(discId, undefined)}
				>
					<Button
						variant="glass"
						aria-pressed={selectedId === undefined}
						onClick={() => onSelect(undefined)}
						className="h-8 rounded-full px-3 text-xs"
					>
						Все
					</Button>
				</Chip>

				{categories.map((category) =>
					editing === category.id ? (
						<NameForm
							key={category.id}
							initial={category.name}
							label={`Название категории «${category.name}»`}
							onSubmit={(name) => {
								const result = renameCategoryById(category.id, name);
								if (result.ok) stopEditing();
								return result.ok ? undefined : result.error;
							}}
							onCancel={stopEditing}
							onError={setError}
						/>
					) : (
						<Chip
							key={category.id}
							selected={selectedId === category.id}
							onDropDisc={(discId) => onDropDisc(discId, category.id)}
						>
							<Button
								variant="glass"
								aria-pressed={selectedId === category.id}
								onClick={() => onSelect(category.id)}
								title={category.name}
								className="block h-8 max-w-[10rem] min-w-0 truncate rounded-full pr-1 pl-3 text-xs"
							>
								{category.name}
							</Button>
							<DropdownMenu>
								<DropdownMenuTrigger
									render={
										<Button
											variant="glass"
											size="icon-xs"
											title={`Категория «${category.name}»: действия`}
											aria-label={`Категория «${category.name}»: действия`}
											className="relative mr-1 rounded-full after:absolute after:-inset-2 after:content-['']"
										/>
									}
								>
									<EllipsisVertical />
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem
										onClick={() => {
											setError(undefined);
											setEditing(category.id);
										}}
									>
										<Pencil />
										Переименовать
									</DropdownMenuItem>
									<DropdownMenuItem
										variant="destructive"
										onClick={() => {
											setError(undefined);
											deleteCategory(category.id);
											if (selectedId === category.id) onSelect(undefined);
										}}
									>
										<Trash2 />
										Удалить категорию
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</Chip>
					)
				)}

				{editing === 'new' ? (
					<NameForm
						initial=""
						label="Название новой категории"
						onSubmit={(name) => {
							const result = createCategory(name);
							if (!result.ok) return result.error;
							stopEditing();
							onSelect(result.id);
							return undefined;
						}}
						onCancel={stopEditing}
						onError={setError}
					/>
				) : (
					<Button
						variant="glass-solid"
						size="icon"
						disabled={atLimit}
						title={
							atLimit ? `Можно создать не больше ${categoryLimit} категорий` : 'Новая категория'
						}
						aria-label="Новая категория"
						onClick={() => {
							setError(undefined);
							setEditing('new');
						}}
						className="rounded-full"
					>
						<Plus />
					</Button>
				)}
			</div>

			{error && (
				<p role="alert" className="text-xs text-red-300">
					{error}
				</p>
			)}
		</div>
	);
}
