import { useCallback, useEffect, useRef, useState } from 'react';

import { setFrontEffectsSuppressed } from '@/widgets/effects/frontSuppressed';
import { useDuckLevel } from '@/hooks/useDuckLevel';
import { useUserActivation } from '@/hooks/useUserActivation';
import { audioTarget } from '@/widgets/youtube/playback';

import { toast } from '@/components/ui/toast';
import { requestOpenWidget } from '@/widgets/dock/openRequests';

import { type TwitchPlayer, loadTwitch } from './player';
import {
	initialStartTracker,
	shouldNotifyWindowClosed,
	startTimeout,
	trackStart,
	twitchErrors,
	twitchPausedToast
} from './twitch';
import { useTwitchSound } from './useTwitch';

// idle — плеера нет (канал не выбран или ещё не запускали); loading — плеер создан, эфир ещё не пошёл;
// playing — идёт; paused — на паузе (нажали мы или Twitch сам); error — эфир не пошёл
export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

// key — какой запуск (канал и номер попытки) сообщил это состояние: состояние прошлого запуска не в счёт
type PlayerState = { key: string; status: PlayerStatus; error?: string };

type PlayerApi = {
	play: () => void;
	pause: () => void;
	audio: () => void;
	visible: (visible: boolean) => void;
};

const noopApi: PlayerApi = { play() {}, pause() {}, audio() {}, visible() {} };

// Плеер Twitch в окне. Создаётся, когда есть канал и посетитель его запустил (attempt растёт при каждом запуске:
// повторный клик по тому же каналу создаёт плеер заново). Эфир стартует без звука, звук включается, если посетитель
// его включил. Twitch сам ставит плеер на паузу, когда его что-то перекрывает или окно скрыто: мы с этим не боремся,
// показываем паузу и запускаем только по клику. Пока окно закрыто, эфир ставим на паузу сами и продолжаем при открытии,
// если до закрытия он играл
export function useTwitchPlayer(login: string | null, attempt: number) {
	const hostRef = useRef<HTMLDivElement>(null);
	// Окно, в котором стоит плеер (его скрывают классом hidden)
	const areaRef = useRef<HTMLDivElement>(null);
	const [state, setState] = useState<PlayerState>({ key: '', status: 'idle' });
	const [windowVisible, setWindowVisible] = useState(false);
	const key = login !== null && attempt > 0 ? `${login}#${attempt}` : '';
	const { soundOn } = useTwitchSound();
	const duck = useDuckLevel();
	const unlocked = useUserActivation();

	const latest = useRef({ soundOn, unlocked, duck });
	useEffect(() => {
		latest.current = { soundOn, unlocked, duck };
	});
	const api = useRef<PlayerApi>(noopApi);

	useEffect(() => {
		const host = hostRef.current;
		if (!host || !login || attempt === 0) return;

		let disposed = false;
		let player: TwitchPlayer | undefined;
		let playerReady = false;
		let tracker = initialStartTracker;
		let windowVisible = false;
		// Эфир шёл, когда окно закрыли: при открытии продолжаем
		let resumeOnShow = false;
		// Окно только что открыли и эфир продолжается: запоздалая пауза от закрытия окна не в счёт, на неё отвечаем play()
		let resumePending = false;
		let resumeTimer: ReturnType<typeof setTimeout> | undefined;
		let status: PlayerStatus = 'loading';
		let appliedMuted: boolean | undefined = true;
		let appliedVolume: number | undefined;

		function setStatus(next: PlayerStatus, error?: string) {
			status = next;
			setState({ key, status: next, error });
		}

		let timeout: ReturnType<typeof setTimeout> | undefined;
		// События play и pause у Twitch приходят не всегда (после рекламной заставки, из скрытого окна), а isPaused()
		// отвечает за плеер всегда: сверяем с ним статус раз в секунду, пока эфир идёт и окно видно
		const syncTimer = setInterval(() => {
			if (disposed || !player || !tracker.started || !windowVisible || resumePending) return;
			const paused = player.isPaused();
			if (paused && status === 'playing') setStatus('paused');
			else if (!paused && status === 'paused') setStatus('playing');
		}, 1000);
		function armTimeout() {
			clearTimeout(timeout);
			const { ms, error } = startTimeout(tracker);
			timeout = setTimeout(() => {
				if (!disposed && !tracker.started) fail(error);
			}, ms);
		}

		function fail(message: string) {
			clearTimeout(timeout);
			setStatus('error', message);
		}
		armTimeout();

		function syncAudio() {
			if (!player || !playerReady) return;
			const target = audioTarget({
				soundOn: latest.current.soundOn,
				unlocked: latest.current.unlocked,
				active: windowVisible,
				duck: latest.current.duck
			});
			// Нулевой множитель — тишина под сигналом таймера: глушим, а не ставим громкость 0 (на iPhone работает только mute)
			if (target.muted) {
				if (appliedMuted !== true) player.setMuted(true);
				appliedMuted = true;
				return;
			}
			const volume = target.volume / 100;
			if (volume !== appliedVolume) player.setVolume(volume);
			appliedVolume = volume;
			if (appliedMuted !== false) player.setMuted(false);
			appliedMuted = false;
		}

		// Тост про паузу: один id, поэтому повторное закрытие окна не множит тосты. «Открыть» открывает окно заново,
		// дальше эфир продолжается обычной логикой показа окна
		function notifyPaused() {
			toast.close(twitchPausedToast.id);
			toast.add({
				id: twitchPausedToast.id,
				title: twitchPausedToast.title,
				description: twitchPausedToast.description,
				timeout: twitchPausedToast.timeoutMs,
				actionProps: {
					children: twitchPausedToast.action,
					onClick: () => {
						toast.close(twitchPausedToast.id);
						requestOpenWidget('twitch');
					}
				}
			});
		}

		api.current = {
			play: () => player?.play(),
			pause: () => {
				resumePending = false;
				player?.pause();
			},
			audio: syncAudio,
			visible(visible) {
				windowVisible = visible;
				syncAudio();
				if (!tracker.started) return;
				if (!visible) {
					resumeOnShow = status === 'playing';
					if (resumeOnShow) {
						player?.pause();
						if (shouldNotifyWindowClosed({ playing: true, tabHidden: document.hidden })) {
							notifyPaused();
						}
					}
				} else if (resumeOnShow) {
					toast.close(twitchPausedToast.id);
					resumeOnShow = false;
					resumePending = true;
					clearTimeout(resumeTimer);
					resumeTimer = setTimeout(() => (resumePending = false), 4000);
					player?.play();
				}
			}
		};

		void loadTwitch().then(
			(Twitch) => {
				if (disposed) return;
				const created = new Twitch.Player(host, {
					channel: login,
					parent: [window.location.hostname],
					autoplay: true,
					muted: true,
					width: '100%',
					height: '100%'
				});
				player = created;

				function track(event: Parameters<typeof trackStart>[1]) {
					if (disposed) return;
					tracker = trackStart(tracker, event);
					if (!tracker.started) armTimeout();
				}

				created.addEventListener(Twitch.Player.READY, () => {
					track('ready');
					playerReady = true;
					syncAudio();
				});
				created.addEventListener(Twitch.Player.ONLINE, () => track('online'));
				created.addEventListener(Twitch.Player.OFFLINE, () => {
					if (disposed || tracker.started) return;
					track('offline');
					fail(twitchErrors.offline);
				});
				created.addEventListener(Twitch.Player.PLAYING, () => {
					if (disposed) return;
					track('playing');
					clearTimeout(timeout);
					setStatus('playing');
					// Плеер мог сбросить звук при старте: применяем заново
					appliedMuted = undefined;
					appliedVolume = undefined;
					syncAudio();
				});
				// Эфир пошёл снова (после паузы или перезапуска потока) без повторного PLAYING: ▶ в шапке больше не нужен
				created.addEventListener(Twitch.Player.PLAY, () => {
					if (disposed || !tracker.started) return;
					setStatus('playing');
				});
				// Паузу поставили мы или Twitch (перекрыли плеер, скрыли окно): в любом случае показываем ▶
				created.addEventListener(Twitch.Player.PAUSE, () => {
					if (disposed || !tracker.started) return;
					if (resumePending) {
						player?.play();
						return;
					}
					setStatus('paused');
				});
			},
			() => {
				if (!disposed) fail(twitchErrors.script);
			}
		);

		// Окно закрыли (hidden) или открыли: скрытый Twitch всё равно не играет
		const area = areaRef.current;
		const observer = area
			? new IntersectionObserver((entries) => {
					const entry = entries[entries.length - 1];
					if (!entry) return;
					setWindowVisible(entry.isIntersecting);
					api.current.visible(entry.isIntersecting);
				})
			: undefined;
		if (area) observer?.observe(area);

		return () => {
			disposed = true;
			clearTimeout(timeout);
			clearTimeout(resumeTimer);
			clearInterval(syncTimer);
			observer?.disconnect();
			api.current = noopApi;
			try {
				player?.destroy?.();
			} catch {
				// Плеер уже убран вместе с iframe
			}
			host.replaceChildren();
		};
	}, [login, attempt, key]);

	useEffect(() => {
		api.current.audio();
	}, [soundOn, unlocked, duck]);

	// Состояние прошлого запуска не в счёт: новый запуск начинается с loading, а без запуска плеера нет
	const current = state.key === key ? state : undefined;
	const status: PlayerStatus = current?.status ?? (key ? 'loading' : 'idle');

	// Пока плеер открыт и виден, эффекты поверх окон убираем: перекрытый плеер Twitch не играет
	const covering = windowVisible && status !== 'idle' && status !== 'error';
	useEffect(() => {
		setFrontEffectsSuppressed('twitch', covering);
		return () => setFrontEffectsSuppressed('twitch', false);
	}, [covering]);

	const toggle = useCallback(() => {
		if (status === 'playing') api.current.pause();
		else if (status === 'paused') api.current.play();
	}, [status]);

	return { hostRef, areaRef, status, error: current?.error, toggle };
}
