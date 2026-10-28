import { LayoutGrid } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Toaster, toast } from '@/components/ui/toast';
import { youtubeThumb } from '@/lib/youtube/thumbs';

import { Background } from './Background';
import { neighbourDisc, previewVariant } from './collection';
import { CollectionPanel } from './CollectionPanel';
import { Controls } from './Controls';
import { Disc } from './Disc';
import { bindMediaHandlers, clearMedia, setMediaPlaying, showMedia } from './mediaSession';
import { overlayComponents } from './overlays';
import { seekTarget } from './progress';
import { afterEnd, overlayList, toggleOverlay } from './settings';
import { updateInCollection, useCollection } from './useCollection';
import { usePlayer } from './usePlayer';
import { updateSettings, usePlayerSettings } from './usePlayerSettings';
import { cn } from '@/lib/utils';

const noDiscTitle = 'Пластинки нет';

// Страница /player: проигрыватель для длинных видео YouTube. Звук идёт из плеера YouTube, а на экране он
// выглядит как вращающаяся пластинка с обложкой или кадром видео
export default function PlayerView() {
	const discs = useCollection();
	const settings = usePlayerSettings();
	const hostRef = useRef<HTMLDivElement>(null);

	// Пластинка из настроек; если её нет в коллекции (удалили), на столе первая
	const current = useMemo(
		() => discs.find((disc) => disc.id === settings.discId) ?? discs[0],
		[discs, settings.discId]
	);
	const index = current ? discs.indexOf(current) : -1;

	// Команды плееру нужны обработчикам, которые создаются до самого плеера
	const controls = useRef<{ play: () => void; seek: (seconds: number) => void }>(undefined);

	const select = useCallback((id: string) => {
		updateSettings({ discId: id });
	}, []);

	const player = usePlayer({
		disc: current,
		hostRef,
		volume: settings.volume,
		muted: settings.muted,
		rate: settings.rate,
		onTitle: (id, title) => updateInCollection(id, { title }),
		onPosition: (id, seconds) => updateInCollection(id, { position: seconds }),
		onEnded: () => {
			if (!current) return;
			const action = afterEnd(settings.repeat, index === discs.length - 1);
			if (action === 'stop') return;
			const next = action === 'next' ? neighbourDisc(discs, current.id, 1) : current;
			if (!next || next.id === current.id) {
				// Та же пластинка: плеер не пересоздаётся, поэтому запускаем заново сами
				controls.current?.seek(0);
				controls.current?.play();
			} else {
				select(next.id);
			}
		},
		onError: (message) => {
			toast.add({
				title: 'Не удалось воспроизвести',
				description: current?.title ? `${current.title}: ${message}` : message,
				type: 'error'
			});
		}
	});
	useEffect(() => {
		controls.current = player;
	});

	const playing = player.status === 'playing';
	const title = current?.title ?? (current ? `Видео ${current.videoId}` : noDiscTitle);
	const wrapAll = settings.repeat !== 'off';

	const togglePlay = useCallback(() => {
		if (playing || player.status === 'buffering') player.pause();
		else player.play();
	}, [playing, player]);

	const step = useCallback(
		(direction: 1 | -1) => {
			const next = neighbourDisc(discs, current?.id, direction);
			if (!next) return;
			if (next.id === current?.id) {
				player.seek(0);
				player.play();
			} else {
				select(next.id);
			}
		},
		[discs, current?.id, player, select]
	);

	const seekBy = useCallback(
		(delta: number) => {
			player.seek(seekTarget(player.current(), delta, player.total()));
		},
		[player]
	);

	// Выбор в коллекции: другая пластинка встаёт на стол и играет сама (плеер стартует с автозапуском),
	// текущая ставится на паузу и обратно
	const onSelect = useCallback(
		(id: string) => {
			if (id === current?.id) togglePlay();
			else select(id);
		},
		[current?.id, togglePlay, select]
	);

	// Системный плеер и клавиши мультимедиа
	const latest = useRef({ togglePlay, step, player });
	useEffect(() => {
		latest.current = { togglePlay, step, player };
	});
	useEffect(
		() =>
			bindMediaHandlers({
				play: () => latest.current.player.play(),
				pause: () => latest.current.player.pause(),
				previous: () => latest.current.step(-1),
				next: () => latest.current.step(1)
			}),
		[]
	);
	const artwork = current
		? youtubeThumb(current.videoId, previewVariant(current.image))
		: undefined;
	useEffect(() => {
		if (current) showMedia(title, artwork);
		else clearMedia();
		return clearMedia;
	}, [current, title, artwork]);
	useEffect(() => {
		setMediaPlaying(playing);
	}, [playing]);

	// Клавиши страницы: пробел, стрелки, N и P. В полях ввода и с Ctrl/Alt/Cmd не работают
	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if (event.ctrlKey || event.altKey || event.metaKey || event.defaultPrevented) return;
			const target = event.target instanceof HTMLElement ? event.target : undefined;
			if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
			// Пробел на кнопке и пункте меню нажимает их, а не ставит паузу
			if (event.code === 'Space' && target?.closest('button, a, [role^="menuitem"]')) return;

			const actions: Record<string, () => void> = {
				Space: () => latest.current.togglePlay(),
				ArrowLeft: () => seekBy(-10),
				ArrowRight: () => seekBy(10),
				KeyN: () => latest.current.step(1),
				KeyP: () => latest.current.step(-1)
			};
			const action = actions[event.code];
			if (!action) return;
			event.preventDefault();
			action();
		}
		document.addEventListener('keydown', onKeyDown);
		return () => document.removeEventListener('keydown', onKeyDown);
	}, [seekBy]);

	const spin = { playing, rate: settings.rate };
	const style = current?.style ?? 'label';

	return (
		<main className="relative h-full w-full overflow-hidden bg-black text-white">
			<h1 className="sr-only">Проигрыватель</h1>
			<Background videoId={current?.videoId} image={current?.image} />

			{/* Прокручивается этот слой, а не main: фон остаётся на месте, пока листается содержимое */}
			<div className="relative h-full scrollbar-glass overflow-x-clip overflow-y-auto">
				<header className="relative z-20 flex items-center justify-end gap-2 p-4 lg:px-8 lg:pt-8">
					<DropdownMenu>
						<DropdownMenuTrigger
							render={
								<Button
									variant="glass-solid"
									className="h-9 rounded-full border border-white/10 bg-black/65 px-3 backdrop-blur-md"
									title="Виджеты поверх пластинки"
									aria-label="Виджеты поверх пластинки"
								/>
							}
						>
							<LayoutGrid />
							Виджеты
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuGroup>
								<DropdownMenuLabel>Поверх пластинки</DropdownMenuLabel>
								{overlayList.map((overlay) => (
									<DropdownMenuCheckboxItem
										key={overlay.id}
										checked={settings.overlays.includes(overlay.id)}
										onCheckedChange={() =>
											updateSettings({ overlays: toggleOverlay(settings.overlays, overlay.id) })
										}
									>
										{overlay.label}
									</DropdownMenuCheckboxItem>
								))}
							</DropdownMenuGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				</header>

				<div className="relative z-10 mx-auto flex w-full max-w-[100rem] flex-col items-center gap-6 px-4 pb-8 xl:grid xl:grid-cols-[minmax(0,1fr)_26rem] xl:items-start xl:gap-10 xl:px-8">
					<section
						aria-label="Пластинка"
						className="flex w-full flex-col items-center gap-6 xl:sticky xl:top-4 xl:min-h-[calc(100cqh-5rem)] xl:justify-center"
					>
						{settings.overlays.map((id) => {
							const Overlay = overlayComponents[id];
							return <Overlay key={id} />;
						})}

						<div className="relative w-[clamp(18rem,70cqmin,36rem)] max-w-full xl:w-[clamp(18rem,min(70cqmin,100cqh-24rem),36rem)]">
							{/* Плеер YouTube нельзя прятать совсем: он стоит под пластинкой и закрыт платформой.
						    Кнопка «Показать видео» переносит его окошком в угол */}
							<div
								ref={hostRef}
								className={cn(
									'absolute size-[200px] [&_iframe]:size-full',
									settings.showVideo
										? '-top-3 -right-3 z-30 overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/20'
										: 'top-1/2 left-1/2 z-0 -translate-1/2'
								)}
							/>
							<span aria-hidden className="absolute inset-0 z-10 rounded-full bg-neutral-950" />
							<button
								type="button"
								onClick={current ? togglePlay : undefined}
								disabled={!current}
								title={playing ? 'Пауза' : 'Играть'}
								aria-label={current ? (playing ? 'Пауза' : 'Играть') : 'Нет пластинки'}
								className="relative z-20 block w-full cursor-pointer rounded-full outline-none focus-visible:ring-4 focus-visible:ring-white/40 disabled:cursor-default"
							>
								<Disc style={style} videoId={current?.videoId} image={current?.image} spin={spin} />
							</button>
						</div>

						{!current && (
							<p className="max-w-xs text-center text-sm text-white/80">
								Вставьте ссылку на видео YouTube в коллекции, чтобы поставить первую пластинку.
							</p>
						)}

						<Controls
							title={title}
							status={player.status}
							time={player.time}
							duration={player.duration}
							settings={settings}
							canSkip={discs.length > 1 || (wrapAll && discs.length > 0)}
							onToggle={togglePlay}
							onSeek={player.seek}
							onPrevious={() => step(-1)}
							onNext={() => step(1)}
							onChange={updateSettings}
						/>
					</section>

					<CollectionPanel
						discs={discs}
						currentId={current?.id}
						spin={spin}
						onSelect={onSelect}
						className="w-full max-w-xl xl:sticky xl:top-4 xl:max-h-[calc(100cqh-2rem)] xl:max-w-none"
					/>
				</div>
			</div>

			{/* Уведомления (src/components/ui/toast.tsx): один раз на всю страницу */}
			<Toaster />
		</main>
	);
}
