import { useEffect, useRef, useState } from 'react';

import { useAutoplay } from '@/hooks/useAutoplay';
import { useDuckLevel } from '@/hooks/useDuckLevel';
import { usePersistentState } from '@/hooks/usePersistentState';
import { unlockAudio } from '@/lib/audio';
import { loadStored, saveStored, storageKeys } from '@/lib/storage';

import { setLevelSource } from './audioAnalyser';
import { applyMediaInfo, mediaInfo } from './mediaSession';
import { registerNowPlayingToggle, setNowPlaying } from './nowPlaying';
import type { RecordStation } from './record';
import { fetchRecordStations } from './recordApi';
import { parseSort, parseSource, parseStation } from './saved';
import {
	placeStation,
	sortStations,
	stationsForSource,
	type RadioSort,
	type StationSource
} from './stations';
import { useRecordTrack } from './useRecordTrack';

export type RadioStatus = 'idle' | 'loading' | 'empty' | 'error';

// Последняя станция, которая реально заиграла. При загрузке страницы с неё и начинаем, но без звука.
// Хранилище недоступно (приватный режим) — после перезагрузки начнём с первой станции
function loadLastStation() {
	return loadStored<RecordStation | undefined>(storageKeys.lastStation, undefined, parseStation);
}

// Вся логика радио: источники станций, воспроизведение и громкость. Разметка — в RadioWidget
export function useRadio() {
	const audioRef = useRef<HTMLAudioElement>(null);
	// Радио всегда стартует выключенным — включает пользователь
	const [playing, setPlaying] = useState(false);
	const [volume, setVolume] = useState(0.8);
	const [muted, setMuted] = useState(false);
	// Все станции Рекорда (с прокси или из снимка в репозитории)
	const [catalog, setCatalog] = useState<RecordStation[]>([]);
	// Очередь воспроизведения: «Следующая станция» идёт по ней
	const [stations, setStations] = useState<RecordStation[]>([]);
	const [currentStation, setCurrentStation] = useState(0);
	// Звук реально идёт: playing — лишь намерение пользователя, а поток может буферизоваться,
	// ждать первого клика (автозапуск заблокирован) или упасть с ошибкой
	const [sounding, setSounding] = useState(false);
	const [status, setStatus] = useState<RadioStatus>('loading');
	// Последний источник запоминаем: все станции или пресет
	const [source, setSource] = usePersistentState<StationSource>(
		storageKeys.radioSource,
		{ kind: 'all' },
		parseSource
	);
	const [sort, setSort] = usePersistentState<RadioSort>(
		storageKeys.radioSort,
		'shuffle',
		parseSort
	);
	// Сколько станций подряд не запустилось — чтобы не перебирать список бесконечно
	const failedStations = useRef(0);

	const station = stations[currentStation];

	// Собирает очередь из источника. first — станция, с которой начать (например, выбранная из избранного)
	function applySource(all: RecordStation[], next: StationSource, first?: RecordStation) {
		setSource(next);
		const items = stationsForSource(all, next);
		if (items.length === 0 && !first) {
			setStations([]);
			setStatus('empty');
			return;
		}
		failedStations.current = 0;
		const sorted = sortStations(items, sort);
		// Станция могла не попасть в источник — тогда ставим её в начало. Берём свежую версию из каталога
		const placed = first
			? placeStation(sorted, all.find((item) => item.id === first.id) ?? first)
			: { list: sorted, index: 0 };
		setStations(placed.list);
		setCurrentStation(placed.index);
		setStatus('idle');
	}

	function loadStations(next: StationSource, first?: RecordStation) {
		applySource(catalog, next, first);
	}

	// Один раз при открытии страницы: загружаем станции и ставим последнюю (без звука).
	// Дальше очередь меняется только по действию пользователя
	useEffect(() => {
		let cancelled = false;
		fetchRecordStations().then((all) => {
			if (cancelled) return;
			setCatalog(all);
			if (all.length === 0) {
				setStatus('error');
				return;
			}
			applySource(all, source, loadLastStation());
		});
		return () => {
			cancelled = true;
		};
		// oxlint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Случайная станция из текущей очереди, кроме играющей
	function randomStation() {
		if (stations.length < 2) return;
		failedStations.current = 0;
		let index = currentStation;
		while (index === currentStation) index = Math.floor(Math.random() * stations.length);
		setCurrentStation(index);
	}

	// Включает станцию: из текущей очереди сразу, иначе (избранное из другого пресета) —
	// очередь становится всеми станциями с выбранной в начале или на своём месте
	function playStation(target: RecordStation) {
		failedStations.current = 0;
		const index = stations.findIndex((item) => item.id === target.id);
		if (index === -1) {
			loadStations({ kind: 'all' }, target);
			return;
		}
		setCurrentStation(index);
	}

	// Переключает порядок очереди, не прерывая текущую станцию
	function changeSort(next: RadioSort) {
		setSort(next);
		const sorted = sortStations(stationsForSource(catalog, source), next);
		// Играющая станция могла быть вне источника (избранное) — оставляем её первой
		const placed = station ? placeStation(sorted, station) : { list: sorted, index: 0 };
		setStations(placed.list);
		setCurrentStation(placed.index);
	}

	function nextStation() {
		setCurrentStation((index) => (index + 1) % stations.length);
	}

	function prevStation() {
		setCurrentStation((index) => (index - 1 + stations.length) % stations.length);
	}

	function handleAudioError() {
		if (stations.length === 0) return;
		failedStations.current += 1;
		if (failedStations.current >= stations.length) {
			setStatus('error');
			return;
		}
		nextStation();
	}

	function togglePlaying() {
		// Клик разблокирует AudioContext, через который идёт анализатор эквалайзера
		unlockAudio();
		// Прямой эфир после паузы отстаёт — перезагружаем поток, чтобы вернуться к живому звуку
		if (!playing) audioRef.current?.load();
		setPlaying((on) => !on);
	}

	function changeVolume(value: number) {
		setVolume(value);
		if (value > 0) setMuted(false);
	}

	function toggleMuted() {
		setMuted((value) => !value);
	}

	// Вокруг сигнала таймера радио затихает. Слайдер при этом показывает громкость пользователя
	const duck = useDuckLevel();

	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;
		audio.volume = volume * duck;
		audio.muted = muted;
	}, [volume, muted, duck]);

	useAutoplay(audioRef, station?.stream, playing);

	// Для эквалайзера (audioAnalyser.ts) нужен сам элемент
	useEffect(() => {
		setLevelSource(audioRef.current);
		return () => setLevelSource(null);
	}, []);

	// Что играет сейчас. Пока прокси не отвечает, трека нет — радио работает как раньше
	const track = useRecordTrack(station?.id, playing);
	const trackArtist = track?.artist;
	const trackSong = track?.song;
	const trackCover = track?.cover;

	// Текущая станция для общего стора (строка под крупными часами). Станция держится и на паузе,
	// а звучит ли она, говорит флаг audible
	const stationName = station?.title;
	useEffect(() => {
		const audible = sounding && playing && !muted && volume > 0;
		setNowPlaying(
			stationName !== undefined
				? {
						name: stationName,
						playing,
						audible,
						track:
							trackSong !== undefined
								? { artist: trackArtist ?? '', song: trackSong, cover: trackCover }
								: undefined
					}
				: null
		);
	}, [sounding, playing, muted, volume, stationName, trackArtist, trackSong, trackCover]);

	// Системный плеер: пока радио включено, показываем станцию и трек
	const stationIcon = station?.icon;
	useEffect(() => {
		if (!playing || stationName === undefined) {
			applyMediaInfo(null);
			return;
		}
		applyMediaInfo(
			mediaInfo(
				{ title: stationName, icon: stationIcon },
				trackSong !== undefined
					? { artist: trackArtist ?? '', song: trackSong, cover: trackCover }
					: undefined
			)
		);
	}, [playing, stationName, stationIcon, trackArtist, trackSong, trackCover]);
	useEffect(() => () => applyMediaInfo(null), []);
	// При размонтировании радио строка с часов пропадает
	useEffect(() => () => setNowPlaying(null), []);

	// Переключатель для кнопки в строке станции на крупных часах. Свежая версия — через ref,
	// чтобы регистрировать один раз
	const toggleRef = useRef(togglePlaying);
	useEffect(() => {
		toggleRef.current = togglePlaying;
	});
	useEffect(() => registerNowPlayingToggle(() => toggleRef.current()), []);

	return {
		// Свойства для элемента <audio>, который рендерит виджет
		audio: {
			ref: audioRef,
			// Потоки Рекорда отдают CORS, без crossOrigin анализатор выдавал бы тишину. Ставится до src
			crossOrigin: 'anonymous' as const,
			src: station?.stream,
			onEnded: nextStation,
			// Пока радио выключено, поток не качаем
			preload: 'none',
			onPlaying: () => {
				failedStations.current = 0;
				setSounding(true);
				if (station) saveStored(storageKeys.lastStation, station);
			},
			onWaiting: () => setSounding(false),
			onPause: () => setSounding(false),
			onEmptied: () => setSounding(false),
			onError: () => {
				setSounding(false);
				handleAudioError();
			}
		},
		sounding,
		track,
		status,
		source,
		sort,
		stations,
		station,
		playing,
		volume,
		muted,
		loadStations,
		changeSort,
		randomStation,
		playStation,
		nextStation,
		prevStation,
		togglePlaying,
		changeVolume,
		toggleMuted
	};
}
