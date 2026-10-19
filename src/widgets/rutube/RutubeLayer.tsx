import { useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { useDuckLevel } from '@/hooks/useDuckLevel';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useUserActivation } from '@/hooks/useUserActivation';
import { mediaQueries } from '@/lib/media';
import { cn } from '@/lib/utils';
import type { RutubeWallpaper } from '@/widgets/wallpaper/wallpapers';
import { audioTarget, shouldPause, wantsSound } from '@/widgets/youtube/playback';

import {
	initialStartTracker,
	isPlaybackSignal,
	parsePlayerMessage,
	playerCommand,
	rutubeEmbedUrl,
	rutubeClickWaitMs,
	rutubeErrors,
	rutubeHints,
	rutubeStartTimeoutMs,
	shouldAwaitClick,
	trackStart
} from './rutube';
import {
	clearLaunch,
	isUserSelected,
	launchEvent,
	useLaunchState,
	useRutubePlayback
} from './useRutube';

// Размеры плеера. Фон: 16:9, не меньше экрана по обеим сторонам (как object-cover). Запуск: по центру поверх окон
const backgroundSize = { width: 'max(100vw, 177.78dvh)', height: 'max(100dvh, 56.25vw)' };
const launchSize = { width: 'var(--rw)', height: 'calc(var(--rw) * 9 / 16)' };

type RutubeLayerProps = {
	wallpaper: RutubeWallpaper;
	// Слой главный: выбран и уже проявился. Звук нужен только ему, чтобы два эфира не звучали вместе
	soundAllowed: boolean;
	// Эфир пошёл: слой можно проявлять
	onReady: () => void;
	// Слой проявился до конца
	onShown?: () => void;
	// Эфир не загрузился или плеер сообщил об ошибке
	onError: (message: string) => void;
	// Посетитель отменил запуск: нужно вернуть прежние обои
	onCancel: () => void;
	className?: string;
};

// Слой фона с эфиром Rutube (iframe плеера). Плеер управляется командами postMessage: пауза, mute и громкость.
// Эфир стартует без звука, иначе браузер не даст запустить видео; звук включается, если посетитель его включил
export function RutubeLayer({
	wallpaper,
	soundAllowed,
	onReady,
	onShown,
	onError,
	onCancel,
	className
}: RutubeLayerProps) {
	const { streamId } = wallpaper;
	const frameRef = useRef<HTMLDivElement>(null);
	const reducedMotion = useMediaQuery(mediaQueries.reducedMotion);
	const { paused, soundOn } = useRutubePlayback();
	const duck = useDuckLevel();
	const unlocked = useUserActivation();
	const { phase } = useLaunchState(streamId);
	const launching = phase === 'launch';

	// Колбэки приходят заново при каждой отрисовке; плеер создаём один раз и берём из ссылки свежие
	const callbacks = useRef({ onReady, onError });
	useEffect(() => {
		callbacks.current = { onReady, onError };
	});

	// Свежие значения для обработчика сообщений, который создаётся один раз
	const latest = useRef({ reducedMotion, paused, soundOn, unlocked, soundAllowed, duck });
	useEffect(() => {
		latest.current = { reducedMotion, paused, soundOn, unlocked, soundAllowed, duck };
	});
	// Пауза и звук применяются отдельно: громкость меняется каждые 100 мс, пока таймер приглушает звук
	const syncRef = useRef({ playback: () => {}, audio: () => {} });

	useEffect(() => {
		const host = frameRef.current;
		if (!host) return;

		let disposed = false;
		let playerReady = false;
		let started = false;
		let tracker = initialStartTracker;
		let signalSeen = false;
		let awaitedBefore = false;
		clearLaunch(streamId);
		let clickTimer: ReturnType<typeof setTimeout> | undefined;

		// Что уже сказали плееру: повторять одно и то же незачем
		let appliedPause: boolean | undefined;
		let appliedMuted: boolean | undefined;
		let appliedVolume: number | undefined;

		const frame = document.createElement('iframe');
		frame.src = rutubeEmbedUrl(streamId);
		frame.title = wallpaper.title;
		frame.allow = 'autoplay; encrypted-media; fullscreen';
		frame.tabIndex = -1;
		host.append(frame);

		// Тишина дольше rutubeStartTimeoutMs — эфир не отвечает. Любое сообщение о состоянии (в том числе
		// о рекламе перед эфиром) начинает отсчёт заново: реклама бывает долгой, но плеер при этом живой
		let timeout: ReturnType<typeof setTimeout>;
		function armTimeout() {
			clearTimeout(timeout);
			timeout = setTimeout(() => {
				if (!started) callbacks.current.onError(rutubeErrors.timeout);
			}, rutubeStartTimeoutMs);
		}
		armTimeout();

		function send(type: string, data?: Record<string, unknown>) {
			frame.contentWindow?.postMessage(playerCommand(type, data), '*');
		}

		function audible() {
			return wantsSound({
				soundOn: latest.current.soundOn,
				unlocked: latest.current.unlocked,
				active: latest.current.soundAllowed
			});
		}

		// Эфир стоит на паузе, если её нажали, вкладка скрыта и эфир без звука или включено «уменьшить движение»
		function syncPlayback() {
			if (!playerReady) return;
			const pause = shouldPause({
				paused: latest.current.paused,
				hidden: document.hidden,
				audible: audible(),
				reducedMotion: latest.current.reducedMotion
			});
			if (pause === appliedPause) return;
			appliedPause = pause;
			send(pause ? 'player:pause' : 'player:play');
		}

		function syncAudio() {
			if (!playerReady) return;
			const target = audioTarget({
				soundOn: latest.current.soundOn,
				unlocked: latest.current.unlocked,
				active: latest.current.soundAllowed,
				duck: latest.current.duck
			});
			// Нулевой множитель — тишина под сигналом таймера: глушим, а не ставим громкость 0 (на iPhone работает только mute)
			if (target.muted) {
				if (appliedMuted !== true) send('player:mute');
				appliedMuted = true;
				return;
			}
			const volume = target.volume / 100;
			if (volume !== appliedVolume) send('player:setVolume', { volume });
			appliedVolume = volume;
			if (appliedMuted !== false) send('player:unMute');
			appliedMuted = false;
		}

		syncRef.current = { playback: syncPlayback, audio: syncAudio };

		function onMessage(event: MessageEvent) {
			if (disposed || event.source !== frame.contentWindow) return;
			if (event.origin !== 'https://rutube.ru') return;
			const message = parsePlayerMessage(event.data);
			if (!message) return;

			// Любое сообщение о состоянии или времени — плеер живой: отсчёт тишины начинается заново
			if (!started && isPlaybackSignal(message.type)) {
				armTimeout();
				signalSeen = true;
			}
			tracker = trackStart(tracker, message);

			if (message.type === 'player:ready') {
				playerReady = true;
				// Эфир запускаем без звука, дальше звук и пауза идут по настройкам
				send('player:mute');
				appliedMuted = true;
				syncPlayback();
				if (appliedPause === undefined) {
					appliedPause = false;
					send('player:play');
				}
				syncAudio();
				// Нет сигналов воспроизведения — плеер ждёт клика внутри iframe. Выбрали эфир только что — поднимаем
				// плеер поверх окон (запуск). Эфир остался после перезагрузки — только отмечаем, что он ждёт
				clickTimer = setTimeout(() => {
					if (disposed || !shouldAwaitClick({ ready: true, started, signalSeen, awaitedBefore })) {
						return;
					}
					awaitedBefore = true;
					clearTimeout(timeout);
					const next = launchEvent(streamId, { type: 'silent', fresh: isUserSelected(streamId) });
					// Слой остаётся фоном и проявляется. В запуске он поверх окон, обои под ним не трогаем
					if (next.phase === 'waiting') callbacks.current.onReady();
				}, rutubeClickWaitMs);
			} else if (message.type === 'player:changeState') {
				// После рекламы плеер встаёт на паузу: пока эфир не пошёл, а мы хотим играть, запускаем его снова
				const state = message.data.state;
				if (!started && appliedPause === false && (state === 'paused' || state === 'pause')) {
					send('player:play');
				}
			} else if (message.type === 'player:error') {
				callbacks.current.onError(rutubeErrors.unavailable);
			}

			if (tracker.started && !started) {
				started = true;
				clearTimeout(timeout);
				clearTimeout(clickTimer);
				launchEvent(streamId, { type: 'started' });
				callbacks.current.onReady();
				// Автозапуск мог сработать уже после паузы
				if (appliedPause) send('player:pause');
			}
		}

		window.addEventListener('message', onMessage);
		document.addEventListener('visibilitychange', syncPlayback);
		return () => {
			disposed = true;
			clearTimeout(timeout);
			clearTimeout(clickTimer);
			clearLaunch(streamId);
			window.removeEventListener('message', onMessage);
			document.removeEventListener('visibilitychange', syncPlayback);
			syncRef.current = { playback: () => {}, audio: () => {} };
			frame.remove();
		};
	}, [streamId, wallpaper.title]);

	// Эффекты объявлены после «latest», поэтому видят уже свежие значения
	useEffect(() => {
		syncRef.current.playback();
		// Звук решает, играть ли в скрытой вкладке
	}, [reducedMotion, paused, soundOn, unlocked, soundAllowed]);

	useEffect(() => {
		syncRef.current.audio();
	}, [soundOn, unlocked, soundAllowed, duck]);

	// Esc отменяет запуск
	useEffect(() => {
		if (!launching) return;
		function onKeyDown(event: KeyboardEvent) {
			if (event.key !== 'Escape') return;
			event.preventDefault();
			event.stopPropagation();
			onCancel();
		}
		window.addEventListener('keydown', onKeyDown, true);
		return () => window.removeEventListener('keydown', onKeyDown, true);
	}, [launching, onCancel]);

	return (
		<div
			// В запуске слой — окно поверх всего, и плеер получает клики. Иначе он только для просмотра:
			// клики и фокус не попадают в плеер
			role={launching ? 'dialog' : undefined}
			aria-modal={launching ? true : undefined}
			aria-label={launching ? rutubeHints.launch : undefined}
			aria-hidden={launching ? undefined : true}
			style={launching ? ({ '--rw': 'min(90vw, 48rem)' } as React.CSSProperties) : undefined}
			onAnimationEnd={(event) => {
				if (event.target === event.currentTarget) onShown?.();
			}}
			className={cn(
				launching
					? 'pointer-events-auto fixed inset-0 z-[60]'
					: 'pointer-events-none absolute inset-0 overflow-hidden bg-black',
				!launching && className
			)}
		>
			{launching && <div className="absolute inset-0 bg-black/75" />}
			<div
				ref={frameRef}
				style={{
					...(launching ? launchSize : backgroundSize),
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)'
				}}
				className={cn(
					'absolute [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:border-0',
					!reducedMotion && 'transition-[width,height] duration-500 ease-in-out',
					launching && 'overflow-hidden rounded-xl bg-black shadow-2xl ring-1 ring-white/20'
				)}
			/>
			{launching && (
				<div
					style={{ bottom: 'calc(50% + var(--rw) * 9 / 32 + 0.75rem)' }}
					className="absolute left-1/2 flex w-(--rw) -translate-x-1/2 items-center gap-2"
				>
					<p className="min-w-0 flex-1 text-sm font-medium text-white">{rutubeHints.launch}</p>
					<Button type="button" variant="glass" onClick={onCancel}>
						{rutubeHints.cancel}
					</Button>
				</div>
			)}
		</div>
	);
}
