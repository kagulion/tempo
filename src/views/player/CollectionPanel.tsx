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
	discStyleLabels,
	discStyles,
	previewVariant,
	type Disc as DiscData,
	type DiscImage,
	type DiscStyle
} from './collection';
import { Disc } from './Disc';
import type { SpinParams } from './useSpin';
import { addToCollection, removeFromCollection, updateInCollection } from './useCollection';

type CollectionProps = {
	discs: DiscData[];
	currentId: string | undefined;
	// Вращение для текущей пластинки; остальные стоят
	spin: SpinParams;
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
	current: boolean;
	spin: SpinParams;
	onSelect: (id: string) => void;
};

// Мини-пластинка с подписью и меню настроек. Кнопка меню лежит рядом с кнопкой выбора, а не внутри неё
function DiscTile({ disc, current, spin, onSelect }: DiscTileProps) {
	const title = discTitle(disc);
	return (
		<li className="relative">
			<button
				type="button"
				onClick={() => onSelect(disc.id)}
				aria-label={`Играть: ${title}`}
				aria-current={current || undefined}
				className={cn(
					'flex w-full flex-col gap-1.5 rounded-xl p-2 text-left transition-colors outline-none hover:bg-white/10 focus-visible:ring-3 focus-visible:ring-white/20',
					current && 'bg-white/10 ring-1 ring-white/30'
				)}
			>
				<Disc
					small
					style={disc.style}
					videoId={disc.videoId}
					image={disc.image}
					spin={current ? spin : undefined}
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
							className="absolute top-1.5 right-1.5 bg-black/50"
						/>
					}
				>
					<EllipsisVertical />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuGroup>
						<DropdownMenuLabel>Вид</DropdownMenuLabel>
						<DropdownMenuRadioGroup
							value={disc.style}
							onValueChange={(value) => updateInCollection(disc.id, { style: value as DiscStyle })}
						>
							{discStyles.map((style) => (
								<DropdownMenuRadioItem key={style} value={style}>
									{discStyleLabels[style]}
								</DropdownMenuRadioItem>
							))}
						</DropdownMenuRadioGroup>
					</DropdownMenuGroup>
					<DropdownMenuSeparator className="bg-white/10" />
					<DropdownMenuGroup>
						<DropdownMenuLabel>Изображение</DropdownMenuLabel>
						<DropdownMenuRadioGroup
							value={disc.image}
							onValueChange={(value) => updateInCollection(disc.id, { image: value as DiscImage })}
						>
							{discImages.map((image) => (
								<DropdownMenuRadioItem key={image} value={image}>
									<img
										src={youtubeThumb(disc.videoId, previewVariant(image))}
										alt=""
										loading="lazy"
										draggable={false}
										className="h-6 w-8 rounded-sm bg-white/10 object-cover"
									/>
									{discImageLabels[image]}
								</DropdownMenuRadioItem>
							))}
						</DropdownMenuRadioGroup>
					</DropdownMenuGroup>
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
	currentId,
	spin,
	onSelect,
	inputRef,
	className
}: CollectionProps) {
	const [link, setLink] = useState('');
	const [error, setError] = useState<string>();
	const history = useYouTubeHistory();
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
		addToCollection(video);
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
									addToCollection(item);
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

			{discs.length === 0 ? (
				<p className="py-4 text-center text-sm text-white/80">
					Пока пусто. Вставьте ссылку на длинное видео или микс, и оно станет пластинкой.
				</p>
			) : (
				<ul className="-mx-2 grid min-h-0 scrollbar-glass grid-cols-2 gap-1 overflow-y-auto">
					{discs.map((disc) => (
						<DiscTile
							key={disc.id}
							disc={disc}
							current={disc.id === currentId}
							spin={spin}
							onSelect={onSelect}
						/>
					))}
				</ul>
			)}
		</Widget>
	);
}
