import { Disc3 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Toaster, toast } from '@/components/ui/toast';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useHotkeys } from '@/hooks/useHotkeys';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { mediaQueries } from '@/lib/media';
import { cn } from '@/lib/utils';
import { youtubeThumb } from '@/lib/youtube/thumbs';
import { DockBar } from '@/widgets/dock/DockBar';
import { FullscreenButton, toggleFullscreen } from '@/widgets/dock/FullscreenButton';
import { HotkeysButton, HotkeysDialog } from '@/widgets/hotkeys/HotkeysDialog';

import { Background } from './Background';
import { neighbourDisc, previewVariant } from './collection';
import { CollectionPanel } from './CollectionPanel';
import { Controls } from './Controls';
import { Disc } from './Disc';
import { bindMediaHandlers, clearMedia, setMediaPlaying, showMedia } from './mediaSession';
import {
	collectionHotkeyLabel,
	playerHotkeyGroups,
	playerHotkeys,
	seekStep,
	skipPlayerHotkey
} from './hotkeys';
import { seekTarget } from './progress';
import { afterEnd } from './settings';
import { updateInCollection, useCollection } from './useCollection';
import { usePlayer } from './usePlayer';
import { updateSettings, usePlayerSettings } from './usePlayerSettings';

const noDiscTitle = 'Пластинки нет';

// Окно коллекции стоит над панелью в правом нижнем углу, как окна столбца «Вид» на рабочем столе. Ширина как у правого
// столбца (26rem), на телефоне — на всю ширину рамки с отступами 1rem. Высота: рамка минус кнопки сверху и панель снизу
// (по 6,5rem снизу и 4,25rem сверху с sm, 7,5rem и 5,25rem с lg), внутри прокручивается сетка пластинок
const collectionWindowClass =
	'widget-window absolute inset-x-4 bottom-[6.5rem] z-10 max-h-[calc(100cqh-10.75rem)] sm:inset-x-auto sm:right-4 sm:w-full sm:max-w-[26rem] lg:right-8 lg:bottom-[7.5rem] lg:max-h-[calc(100cqh-12.75rem)]';

// Панель с кнопкой коллекции: положение как у панели «Вид» на рабочем столе, на телефоне тоже справа внизу
const dockClass = 'absolute right-4 bottom-4 lg:right-8 lg:bottom-8';

// С xl окно коллекции не накрывает пластинку, а стоит рядом: пластинка с пультом сдвигается на половину места,
// занятого окном (26rem ширина + 2rem поле справа + 2rem зазор = 30rem), и остаётся по центру свободной части
const discShiftClass = 'xl:-translate-x-60';

// Страница /player: проигрыватель для длинных видео YouTube. Звук идёт из плеера YouTube, а на экране он
// выглядит как вращающаяся пластинка с обложкой или кадром видео
export default function PlayerView() {
	const discs = useCollection();
	const settings = usePlayerSettings();
	const hostRef = useRef<HTMLDivElement>(null);
	const [helpOpen, setHelpOpen] = useState(false);
	const linkRef = useRef<HTMLInputElement>(null);
	// Клавиатуры на телефоне нет: кнопку со списком клавиш прячем
	const touchOnly = useMediaQuery(mediaQueries.coarsePointer);

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

	const collectionOpen = settings.collectionOpen;
	const toggleCollection = useCallback(() => {
		updateSettings({ collectionOpen: !collectionOpen });
	}, [collectionOpen]);
	// Кнопка в подсказке пустой коллекции: открывает окно и ставит курсор в поле для ссылки. Закрытое окно
	// скрыто (display: none), фокус в него встаёт только после перерисовки, поэтому только просьба, а фокус — в эффекте
	const [linkFocusRequest, setLinkFocusRequest] = useState(0);
	const openCollection = useCallback(() => {
		updateSettings({ collectionOpen: true });
		setLinkFocusRequest((count) => count + 1);
	}, []);
	useEffect(() => {
		if (linkFocusRequest > 0) linkRef.current?.focus();
	}, [linkFocusRequest]);

	// Клавиши страницы (hotkeys.ts): общий механизм с рабочим столом, поэтому «Клавиши сайта», поля ввода и
	// Ctrl/Alt/Cmd работают так же. Пока открыт список клавиш, остальные клавиши ждут
	useHotkeys(
		playerHotkeys,
		(action) => {
			if (action === 'help') return setHelpOpen((open) => !open);
			if (helpOpen) return;
			if (action === 'collection') return toggleCollection();
			if (action === 'togglePlay') return togglePlay();
			if (action === 'seekBack') return seekBy(-seekStep);
			if (action === 'seekForward') return seekBy(seekStep);
			if (action === 'next') return step(1);
			if (action === 'previous') return step(-1);
			if (action === 'fullscreen' && document.fullscreenEnabled) toggleFullscreen();
		},
		skipPlayerHotkey
	);

	const spin = { playing, rate: settings.rate };
	const style = current?.style ?? 'label';

	return (
		<TooltipProvider>
			<main className="relative h-full w-full overflow-hidden bg-black text-white">
				<h1 className="sr-only">Проигрыватель</h1>
				<Background videoId={current?.videoId} image={current?.image} />

				{/* Прокручивается этот слой, а не main: фон остаётся на месте, пока листается содержимое */}
				{/* Кнопки в углу там же, где на рабочем столе (App.tsx) */}
				<div className="absolute top-4 right-4 z-20 flex items-center gap-2 lg:top-8 lg:right-8">
					{!touchOnly && <HotkeysButton onClick={() => setHelpOpen(true)} />}
					<FullscreenButton />
				</div>

				<div className="relative h-full scrollbar-glass overflow-x-clip overflow-y-auto">
					{/* Внизу запас под панель, чтобы пульт не уходил под неё */}
					<div className="relative z-10 mx-auto flex min-h-full w-full max-w-[100rem] flex-col items-center justify-center px-4 pt-[4.25rem] pb-28 lg:pt-[5.25rem] lg:pb-28 xl:px-8">
						<section
							aria-label="Пластинка"
							className={cn(
								'flex w-full flex-col items-center gap-6',
								// Сдвиг только transform-ом (translate), без пересчёта раскладки; при уменьшенном движении сразу
								'motion-reduce:transition-none xl:transition-[translate] xl:duration-300 xl:ease-[cubic-bezier(0.23,1,0.32,1)]',
								collectionOpen && discShiftClass
							)}
						>
							<div
								className={cn(
									'relative w-[clamp(18rem,70cqmin,36rem)] max-w-full',
									// С lg пластинка, пульт и запас под панель помещаются в рамку без прокрутки: ширина считается от высоты.
									// Без пластинки плеера нет, нижняя граница ширины не нужна, а место нужно ещё подсказке с кнопкой
									current
										? 'lg:w-[clamp(18rem,min(70cqmin,100cqh-25rem),36rem)]'
										: 'lg:w-[clamp(10rem,min(70cqmin,100cqh-32rem),36rem)]'
								)}
							>
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
									<Disc
										style={style}
										videoId={current?.videoId}
										image={current?.image}
										spin={spin}
									/>
								</button>
							</div>

							{!current && (
								<div className="flex max-w-xs flex-col items-center gap-3">
									<p className="text-center text-sm text-white/80">
										Вставьте ссылку на видео YouTube в коллекции, чтобы поставить первую пластинку.
									</p>
									{!collectionOpen && (
										<Button variant="glass-solid" size="sm" onClick={openCollection}>
											Открыть коллекцию
										</Button>
									)}
								</div>
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
					</div>
				</div>

				{/* Закрытое окно скрыто (hidden), а не убрано: введённая ссылка и прокрутка сохраняются */}
				<CollectionPanel
					discs={discs}
					currentId={current?.id}
					onSelect={onSelect}
					inputRef={linkRef}
					className={cn(collectionWindowClass, !collectionOpen && 'hidden')}
				/>

				<DockBar
					label="Пластинки"
					className={dockClass}
					groups={[
						{
							id: 'discs',
							label: 'Пластинки',
							buttons: [
								{
									id: 'collection',
									label: 'Коллекция',
									icon: Disc3,
									hotkey: collectionHotkeyLabel,
									pressed: collectionOpen,
									onClick: toggleCollection
								}
							]
						}
					]}
				/>

				<HotkeysDialog
					open={helpOpen}
					onClose={() => setHelpOpen(false)}
					bindings={playerHotkeys}
					groups={playerHotkeyGroups}
				/>

				{/* Уведомления (src/components/ui/toast.tsx): один раз на всю страницу */}
				<Toaster />
			</main>
		</TooltipProvider>
	);
}
