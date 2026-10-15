import { useEffect, useRef, useState } from 'react';

import { useAutoplay } from '@/hooks/useAutoplay';
import { useDuckLevel } from '@/hooks/useDuckLevel';
import { usePersistentState } from '@/hooks/usePersistentState';
import { loadStored, saveStored, storageKeys } from '@/lib/storage';

import {
	countStationClick,
	detectCountryCode,
	fetchCountries,
	fetchStations,
	voteStation,
	type RadioCountry
} from './api';
import { setNowPlaying } from './nowPlaying';
import {
	curatedIds,
	minSearchLength,
	normalizeStation,
	parseSort,
	parseSource,
	placeStation,
	sortStations,
	type RadioSort,
	type Station,
	type StationSource
} from './stations';
import { useLikedStations } from './useLikedStations';

export type RadioStatus = 'idle' | 'loading' | 'empty' | 'error';

// Пауза после последней набранной буквы, чтобы не слать запрос на каждую
const searchDelay = 400;

// Последняя станция, которая реально заиграла. При загрузке страницы с неё и начинаем, но без звука.
// Хранилище недоступно (приватный режим) — после перезагрузки начнём со случайной станции
function loadLastStation() {
	return loadStored<Station | undefined>(storageKeys.lastStation, undefined, normalizeStation);
}

function addVote(stations: Station[], uuid: string) {
	return stations.map((item) =>
		item.stationuuid === uuid ? { ...item, votes: item.votes + 1 } : item
	);
}

// Вся логика радио: источники станций, воспроизведение, голоса и громкость. Разметка — в RadioWidget
export function useRadio() {
	const audioRef = useRef<HTMLAudioElement>(null);
	// Радио всегда стартует выключенным — включает пользователь
	const [playing, setPlaying] = useState(false);
	const [volume, setVolume] = useState(0.8);
	const [muted, setMuted] = useState(false);
	// Очередь воспроизведения: «Следующая станция» идёт по ней
	const [stations, setStations] = useState<Station[]>([]);
	const [currentStation, setCurrentStation] = useState(0);
	// Звук реально идёт: playing — лишь намерение пользователя, а поток может буферизоваться,
	// ждать первого клика (автозапуск заблокирован) или упасть с ошибкой
	const [sounding, setSounding] = useState(false);
	const [status, setStatus] = useState<RadioStatus>('loading');
	const [countries, setCountries] = useState<RadioCountry[]>([]);
	// Последний источник запоминаем: страна, жанр или поиск
	const [source, setSource] = usePersistentState<StationSource>(
		storageKeys.radioSource,
		{ kind: 'country', code: detectCountryCode() },
		parseSource
	);
	const [sort, setSort] = usePersistentState<RadioSort>(
		storageKeys.radioSort,
		'shuffle',
		parseSort
	);
	// Результаты поиска по всем странам лежат отдельно от очереди, чтобы поиск не прерывал звук
	const [searchResults, setSearchResults] = useState<Station[]>([]);
	const [searchStatus, setSearchStatus] = useState<RadioStatus>('idle');
	// Набранный запрос живёт отдельно от источника: набор текста не прерывает звук
	const [searchQuery, setSearchQuery] = useState(source.kind === 'search' ? source.query : '');
	const [voting, setVoting] = useState(false);
	const [voteError, setVoteError] = useState<{ uuid: string; message: string }>();
	const { isLiked, markLiked } = useLikedStations();
	// Номер последнего запроса станций — ответы на устаревшие запросы игнорируем
	const stationsRequest = useRef(0);
	const searchRequest = useRef(0);
	const searchTimer = useRef<number>(undefined);
	// Сколько станций подряд не запустилось — чтобы не перебирать список бесконечно
	const failedStations = useRef(0);
	// Станции, которым в этой сессии уже засчитали клик
	const countedClicks = useRef(new Set<string>());

	const station = stations[currentStation];

	// first — станция, с которой начать (например, выбранная из избранного)
	async function loadStations(next: StationSource, first?: Station) {
		const request = ++stationsRequest.current;
		window.clearTimeout(searchTimer.current);
		setSource(next);
		setStatus('loading');
		try {
			const list = await fetchStations(next);
			if (request !== stationsRequest.current) return;
			if (list.length === 0 && !first) {
				setStations([]);
				setStatus('empty');
				return;
			}
			failedStations.current = 0;
			const sorted = sortStations(list, sort, curatedIds(next));
			// Станция могла выпасть из выдачи — тогда ставим её на законное место
			const placed = first ? placeStation(sorted, first, sort) : { list: sorted, index: 0 };
			setStations(placed.list);
			setCurrentStation(placed.index);
			setStatus('idle');
		} catch {
			if (request === stationsRequest.current) setStatus('error');
		}
	}

	async function runSearch(query: string) {
		const request = ++searchRequest.current;
		try {
			const list = await fetchStations({ kind: 'search', query });
			if (request !== searchRequest.current) return;
			setSearchResults(list);
			setSearchStatus(list.length === 0 ? 'empty' : 'idle');
		} catch {
			if (request === searchRequest.current) setSearchStatus('error');
		}
	}

	// После перезагрузки с сохранённым поиском: выдача становится очередью, прошлая станция встаёт
	// на своё место. Пока выдача не пришла, очередь — одна прошлая станция
	async function restoreSearch(query: string, last: Station) {
		const request = ++stationsRequest.current;
		const searchId = ++searchRequest.current;
		setSearchStatus('loading');
		try {
			const list = await fetchStations({ kind: 'search', query });
			if (searchId === searchRequest.current) {
				setSearchResults(list);
				setSearchStatus(list.length === 0 ? 'empty' : 'idle');
			}
			// Посетитель уже выбрал другое — очередь не трогаем
			if (request !== stationsRequest.current) return;
			const placed = placeStation(sortStations(list, sort), last, sort);
			setStations(placed.list);
			setCurrentStation(placed.index);
		} catch {
			if (searchId === searchRequest.current) setSearchStatus('error');
		}
	}

	// Запрос уходит после паузы в наборе и только от двух символов. Источник и очередь не меняются:
	// станция продолжает играть, пока посетитель ищет другую
	function search(query: string) {
		// Устаревшие ответы больше не нужны
		searchRequest.current += 1;
		window.clearTimeout(searchTimer.current);
		setSearchQuery(query);
		if (query.trim().length < minSearchLength) {
			setSearchResults([]);
			setSearchStatus('idle');
			return;
		}
		setSearchStatus('loading');
		searchTimer.current = window.setTimeout(() => runSearch(query), searchDelay);
	}

	async function loadCountries() {
		try {
			const list = await fetchCountries();
			setCountries(list);
			return list;
		} catch {
			return [];
		}
	}

	// Один раз при открытии страницы: последняя станция или источник посетителя. Дальше станции
	// грузятся только по действию пользователя, поэтому от source эффект не зависит.
	// loadStations сразу ставит статус «загрузка» — это и есть начало запроса к API
	useEffect(() => {
		const last = loadLastStation();
		if (source.kind === 'genre') {
			// oxlint-disable-next-line react/set-state-in-effect
			loadStations(source, last);
		} else if (source.kind === 'search' && last) {
			// Пока выдача не пришла, очередь — прошлая станция
			setStations([last]);
			setCurrentStation(0);
			setStatus('idle');
			if (source.query.trim().length >= minSearchLength) restoreSearch(source.query, last);
		} else if (last) {
			// Последняя станция загружает свою страну
			loadStations({ kind: 'country', code: last.countrycode }, last);
		} else {
			loadStations(
				source.kind === 'country' ? source : { kind: 'country', code: detectCountryCode() }
			);
		}
		loadCountries();
		return () => window.clearTimeout(searchTimer.current);
		// oxlint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	async function randomCountry() {
		const list = countries.length > 0 ? countries : await loadCountries();
		// Для случайного выбора берём страны с большим количеством станций
		const current = source.kind === 'country' ? source.code : '';
		const candidates = list.filter((item) => item.stationCount >= 30 && item.code !== current);
		if (candidates.length === 0) return;
		await loadStations({
			kind: 'country',
			code: candidates[Math.floor(Math.random() * candidates.length)].code
		});
	}

	// Станция из результатов поиска: очередь становится выдачей, источник — поиском
	function playSearchResult(target: Station) {
		failedStations.current = 0;
		// Загрузка станций, начатая раньше, больше не нужна
		stationsRequest.current += 1;
		window.clearTimeout(searchTimer.current);
		const queue = sortStations(searchResults, sort);
		setSource({ kind: 'search', query: searchQuery });
		setStations(queue);
		setCurrentStation(
			Math.max(
				0,
				queue.findIndex((item) => item.stationuuid === target.stationuuid)
			)
		);
		setStatus('idle');
	}

	// Включает станцию: из текущей очереди или избранного сразу, из другой страны — после
	// загрузки её станций
	function playStation(target: Station) {
		failedStations.current = 0;
		const index = stations.findIndex((item) => item.stationuuid === target.stationuuid);
		if (index === -1) {
			loadStations({ kind: 'country', code: target.countrycode }, target);
			return;
		}
		setCurrentStation(index);
	}

	// Переключает порядок очереди, не прерывая текущую станцию
	function changeSort(next: RadioSort) {
		setSort(next);
		const sorted = sortStations(stations, next, curatedIds(source));
		const index = sorted.findIndex((item) => item.stationuuid === station?.stationuuid);
		setStations(sorted);
		setCurrentStation(Math.max(0, index));
	}

	// Голос за текущую станцию. Лайкнутой станция становится, только если сервер принял голос
	async function likeStation() {
		if (!station || voting || isLiked(station.stationuuid)) return;
		const uuid = station.stationuuid;
		setVoting(true);
		setVoteError(undefined);
		const result = await voteStation(uuid);
		setVoting(false);
		if (result.ok) {
			markLiked(uuid);
			setStations((list) => addVote(list, uuid));
			setSearchResults((list) => addVote(list, uuid));
		} else {
			setVoteError({ uuid, message: result.message });
		}
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

	useAutoplay(audioRef, station?.url_resolved, playing);

	// Текущая станция для общего стора (строка под крупными часами). Звучит — значит показываем
	const stationName = station?.name;
	const stationCountry = station?.countrycode;
	useEffect(() => {
		const audible = sounding && playing && !muted && volume > 0;
		setNowPlaying(
			audible && stationName !== undefined && stationCountry !== undefined
				? { name: stationName, countrycode: stationCountry }
				: null
		);
	}, [sounding, playing, muted, volume, stationName, stationCountry]);
	// При размонтировании радио строка с часов пропадает
	useEffect(() => () => setNowPlaying(null), []);

	return {
		// Свойства для элемента <audio>, который рендерит виджет
		audio: {
			ref: audioRef,
			src: station?.url_resolved,
			onEnded: nextStation,
			// Пока радио выключено, поток не качаем
			preload: 'none',
			onPlaying: () => {
				failedStations.current = 0;
				setSounding(true);
				if (station) {
					saveStored(storageKeys.lastStation, station);
					// Так Radio Browser считает запуск станции кликом: один раз за сессию
					if (!countedClicks.current.has(station.stationuuid)) {
						countedClicks.current.add(station.stationuuid);
						countStationClick(station.stationuuid);
					}
				}
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
		status,
		countries,
		source,
		sort,
		stations,
		searchResults,
		searchStatus,
		searchQuery,
		voting,
		liked: isLiked(station?.stationuuid),
		voteError: voteError?.uuid === station?.stationuuid ? voteError?.message : undefined,
		station,
		playing,
		volume,
		muted,
		loadStations,
		search,
		playSearchResult,
		changeSort,
		likeStation,
		randomCountry,
		playStation,
		nextStation,
		prevStation,
		togglePlaying,
		changeVolume,
		toggleMuted
	};
}
