import { EllipsisVertical, History, Plus, Trash2 } from 'lucide-react';
import { useState, type FormEvent, type Ref } from 'react';

import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { parseYouTubeUrl } from '@/lib/youtube/links';
import { youtubeThumb } from '@/lib/youtube/thumbs';
import { Widget, WidgetHeader } from '@/widgets/Widget';
import { useYouTubeHistory } from '@/widgets/youtube/useYouTubeHistory';

import {
	discImageLabels,
	discImages,
	discLimit,
	type Disc as DiscData,
	type DiscImage,
	type DiscStyle
} from './collection';
import { discCategoryId, discDragType, filterDiscs, type Category } from './categories';
import { CategoryBar } from './CategoryBar';
import { Sleeve } from './Sleeve';
import { useCategories } from './useCategories';
import {
	addToCollection,
	moveToCategory,
	removeFromCollection,
	updateInCollection
} from './useCollection';

type CollectionProps = {
	discs: DiscData[];
	// Вид упаковок: один на все пластинки
	style: DiscStyle;
	currentId: string | undefined;
	// Выбрать пластинку: она встаёт на стол и играет
	onSelect: (id: string) => void;
	// Поле для ссылки: страница ставит в него фокус, когда открывает окно кнопкой
	inputRef?: Ref<HTMLInputElement>;
	className?: string;
};

function discTitle(disc: DiscData) {
	return disc.title ?? `Видео ${disc.videoId}`;
}

type DiscTileProps = {
	disc: DiscData;
	categories: Category[];
	style: DiscStyle;
	current: boolean;
	onSelect: (id: string) => void;
};

// Упаковка пластинки (вид общий, берётся из настроек) с подписью и меню настроек. Кнопка меню лежит рядом с кнопкой выбора, а не внутри неё
function DiscTile({ disc, categories, style, current, onSelect }: DiscTileProps) {
	const title = discTitle(disc);
	const [dragging, setDragging] = useState(false);
	return (
		// Плитку можно перетащить на вкладку категории; на сенсорных экранах перетаскивания нет, там работает меню
		<li
			draggable
			onDragStart={(event) => {
				event.dataTransfer.setData(discDragType, disc.id);
				event.dataTransfer.effectAllowed = 'move';
				setDragging(true);
			}}
			onDragEnd={() => setDragging(false)}
			className={cn('relative transition-opacity', dragging && 'opacity-50')}
		>
			<button
				type="button"
				onClick={() => onSelect(disc.id)}
				aria-label={`Играть: ${title}`}
				aria-current={current || undefined}
				className={cn(
					'flex w-full flex-col gap-1.5 rounded-xl p-1.5 text-left transition-colors outline-none hover:bg-white/10 focus-visible:ring-3 focus-visible:ring-white/20',
					current && 'bg-white/10 ring-1 ring-white/30'
				)}
			>
				<Sleeve
					style={style}
					videoId={disc.videoId}
					image={disc.image}
					className="shadow-[0_6px_16px_rgba(0,0,0,0.5)]"
				/>
				<span className="line-clamp-2 text-xs text-white/80" title={title}>
					{title}
				</span>
			</button>

			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button
							variant="glass"
							size="icon-xs"
							title={`Настройки: ${title}`}
							aria-label={`Настройки: ${title}`}
							className="absolute top-2 right-2 bg-black/50 after:absolute after:-inset-2 after:content-['']"
						/>
					}
				>
					<EllipsisVertical />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="max-w-[min(16rem,90vw)]">
					<DropdownMenuGroup>
						<DropdownMenuLabel>Изображение</DropdownMenuLabel>
						<DropdownMenuRadioGroup
							value={disc.image}
							onValueChange={(value) => updateInCollection(disc.id, { image: value as DiscImage })}
							className="grid grid-cols-2 gap-1"
						>
							{discImages.map((image) => (
								<DropdownMenuRadioItem
									key={image}
									value={image}
									// Ячейка сетки: упаковка и подпись; галочку прячем, выбранную отмечает кольцо
									className="w-24 flex-col gap-1 p-1.5 text-xs data-checked:ring-2 data-checked:ring-white/70 [&>[data-slot=dropdown-menu-radio-item-indicator]]:hidden"
								>
									<Sleeve style={style} videoId={disc.videoId} image={image} className="w-full" />
									{discImageLabels[image]}
								</DropdownMenuRadioItem>
							))}
						</DropdownMenuRadioGroup>
					</DropdownMenuGroup>
					{categories.length > 0 && (
						<>
							<DropdownMenuSeparator className="bg-white/10" />
							<DropdownMenuGroup>
								<DropdownMenuLabel>Категория</DropdownMenuLabel>
								<DropdownMenuRadioGroup
									value={discCategoryId(categories, disc) ?? ''}
									onValueChange={(value) =>
										moveToCategory(disc.id, value === '' ? undefined : value)
									}
								>
									<DropdownMenuRadioItem value="">Без категории</DropdownMenuRadioItem>
									{categories.map((category) => (
										<DropdownMenuRadioItem key={category.id} value={category.id}>
											<span className="truncate">{category.name}</span>
										</DropdownMenuRadioItem>
									))}
								</DropdownMenuRadioGroup>
							</DropdownMenuGroup>
						</>
					)}
					<DropdownMenuSeparator className="bg-white/10" />
					<DropdownMenuItem variant="destructive" onClick={() => removeFromCollection(disc.id)}>
						<Trash2 />
						Убрать из коллекции
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</li>
	);
}

// Окно коллекции (положение задаёт страница через className, закрытое окно получает hidden и остаётся в DOM): поле для ссылки, сетка мини-пластинок, добавление из «Моих видео» фона YouTube
export function CollectionPanel({
	discs,
	style,
	currentId,
	onSelect,
	inputRef,
	className
}: CollectionProps) {
	const [link, setLink] = useState('');
	const [error, setError] = useState<string>();
	const history = useYouTubeHistory();
	const categories = useCategories();
	// Открытая вкладка: undefined — «Все». Если выбранную категорию удалили, показываем «Все»
	const [tab, setTab] = useState<string>();
	const activeId = categories.some((category) => category.id === tab) ? tab : undefined;
	const visible = filterDiscs(discs, categories, activeId);
	const fresh = history.filter((item) => !discs.some((disc) => disc.id === item.videoId));

	function submit(event: FormEvent) {
		event.preventDefault();
		const video = parseYouTubeUrl(link);
		if (!video) {
			setError('Это не похоже на ссылку на видео YouTube');
			return;
		}
		setError(undefined);
		setLink('');
		addToCollection({ ...video, categoryId: activeId });
		onSelect(video.videoId);
	}

	return (
		<Widget className={cn('flex min-h-0 flex-col gap-3 p-4', className)}>
			<WidgetHeader title={`Коллекция · ${discs.length}/${discLimit}`} />

			<form onSubmit={submit} className="flex flex-col gap-1.5" noValidate>
				<div className="flex gap-2">
					<Input
						ref={inputRef}
						variant="glass"
						type="text"
						inputMode="url"
						value={link}
						onChange={(event) => {
							setLink(event.target.value);
							setError(undefined);
						}}
						placeholder="Ссылка на YouTube"
						aria-label="Ссылка на YouTube"
						aria-invalid={error !== undefined}
						aria-describedby={error ? 'player-link-error' : undefined}
						autoComplete="off"
						spellCheck={false}
					/>
					<Button
						type="submit"
						variant="glass-solid"
						size="icon"
						title="Добавить пластинку"
						aria-label="Добавить пластинку"
					>
						<Plus />
					</Button>
				</div>
				{error && (
					<p id="player-link-error" role="alert" className="text-xs text-red-300">
						{error}
					</p>
				)}
			</form>

			<DropdownMenu>
				<DropdownMenuTrigger
					disabled={fresh.length === 0}
					render={<Button variant="glass-solid" size="sm" className="self-start" />}
				>
					<History />
					Добавить из «Моих видео»
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start" className="max-w-[min(20rem,90vw)]">
					<DropdownMenuGroup>
						<DropdownMenuLabel>Фон YouTube</DropdownMenuLabel>
						{fresh.map((item) => (
							<DropdownMenuItem
								key={item.videoId}
								onClick={() => {
									addToCollection({ ...item, categoryId: activeId });
									onSelect(item.videoId);
								}}
							>
								<img
									src={youtubeThumb(item.videoId)}
									alt=""
									loading="lazy"
									draggable={false}
									className="h-6 w-8 shrink-0 rounded-sm bg-white/10 object-cover"
								/>
								<span className="truncate">{item.title ?? `Видео ${item.videoId}`}</span>
							</DropdownMenuItem>
						))}
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>

			<CategoryBar
				categories={categories}
				selectedId={activeId}
				onSelect={setTab}
				onDropDisc={moveToCategory}
			/>

			{discs.length === 0 ? (
				<p className="py-4 text-center text-sm text-white/80">
					Пока пусто. Вставьте ссылку на длинное видео или микс, и оно станет пластинкой.
				</p>
			) : visible.length === 0 ? (
				<p className="py-4 text-center text-sm text-white/80">
					В этой категории пока пусто. Перетащите пластинку на вкладку или выберите категорию в меню
					пластинки.
				</p>
			) : (
				<ul className="-mx-1.5 grid min-h-0 scrollbar-glass grid-cols-3 gap-0.5 overflow-y-auto">
					{visible.map((disc) => (
						<DiscTile
							key={disc.id}
							disc={disc}
							categories={categories}
							style={style}
							current={disc.id === currentId}
							onSelect={onSelect}
						/>
					))}
				</ul>
			)}
		</Widget>
	);
}
