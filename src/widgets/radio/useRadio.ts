import { useEffect, useRef, useState } from 'react';

import { useAutoplay } from '@/hooks/useAutoplay';
import { useDuckLevel } from '@/hooks/useDuckLevel';
import { isRecord, loadStored, saveStored, storageKeys } from '@/lib/storage';

import {
	detectCountryCode,
	fetchCountries,
	fetchStations,
	type RadioCountry,
	type Station
} from './api';

export type RadioStatus = 'idle' | 'loading' | 'empty' | 'error';

function parseStation(saved: unknown): Station | undefined {
	return isRecord(saved) &&
		typeof saved.stationuuid === 'string' &&
		typeof saved.countrycode === 'string'
		? (saved as Station)
		: undefined;
}

// Последняя станция, которая реально заиграла. При загрузке страницы с неё и начинаем, но без звука.
// Хранилище недоступно (приватный режим) — после перезагрузки начнём со случайной станции
function loadLastStation() {
	return loadStored<Station | undefined>(storageKeys.lastStation, undefined, parseStation);
}

// Перемешиваем станции, чтобы каждый раз звучало что-то новое, а не одни и те же лидеры рейтинга
function shuffle<T>(items: T[]) {
	const result = [...items];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

// Вся логика радио: страны, станции, воспроизведение и громкость. Разметка — в RadioWidget
export function useRadio() {
	const audioRef = useRef<HTMLAudioElement>(null);
	// Радио всегда стартует выключенным — включает пользователь
	const [playing, setPlaying] = useState(false);
	const [volume, setVolume] = useState(0.8);
	const [muted, setMuted] = useState(false);
	const [stations, setStations] = useState<Station[]>([]);
	const [currentStation, setCurrentStation] = useState(0);
	const [status, setStatus] = useState<RadioStatus>('loading');
	const [countries, setCountries] = useState<RadioCountry[]>([]);
	const [country, setCountry] = useState(detectCountryCode);
	// Номер последнего запроса станций — ответы на устаревшие запросы игнорируем
	const stationsRequest = useRef(0);
	// Сколько станций подряд не запустилось — чтобы не перебирать список бесконечно
	const failedStations = useRef(0);

	const station = stations[currentStation];

	// first — станция, с которой начать (например, выбранная из избранного)
	async function loadStations(countryCode: string, first?: Station) {
		const request = ++stationsRequest.current;
		setCountry(countryCode);
		setStatus('loading');
		try {
			const list = await fetchStations(countryCode);
			if (request !== stationsRequest.current) return;
			if (list.length === 0 && !first) {
				setStations([]);
				setStatus('empty');
				return;
			}
			failedStations.current = 0;
			const shuffled = shuffle(list);
			// Станция могла выпасть из топа страны — тогда добавляем её из сохранённых данных
			setStations(
				first
					? [first, ...shuffled.filter((item) => item.stationuuid !== first.stationuuid)]
					: shuffled
			);
			setCurrentStation(0);
			setStatus('idle');
		} catch {
			if (request === stationsRequest.current) setStatus('error');
		}
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

	// Один раз при открытии страницы: последняя станция или страна посетителя. Дальше станции
	// грузятся только по действию пользователя, поэтому от country эффект не зависит.
	// loadStations сразу ставит статус «загрузка» — это и есть начало запроса к API
	useEffect(() => {
		const last = loadLastStation();
		// oxlint-disable-next-line react/set-state-in-effect
		if (last) loadStations(last.countrycode, last);
		else loadStations(country);
		loadCountries();
		// oxlint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	async function randomCountry() {
		const list = countries.length > 0 ? countries : await loadCountries();
		// Для случайного выбора берём страны с большим количеством станций
		const candidates = list.filter((item) => item.stationCount >= 30 && item.code !== country);
		if (candidates.length === 0) return;
		await loadStations(candidates[Math.floor(Math.random() * candidates.length)].code);
	}

	// Включает станцию: из текущего списка сразу, из другой страны — после загрузки её станций
	function playStation(target: Station) {
		const index = stations.findIndex((item) => item.stationuuid === target.stationuuid);
		if (index === -1) {
			loadStations(target.countrycode, target);
			return;
		}
		failedStations.current = 0;
		setCurrentStation(index);
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
				if (station) saveStored(storageKeys.lastStation, station);
			},
			onError: handleAudioError
		},
		status,
		countries,
		country,
		stations,
		station,
		playing,
		volume,
		muted,
		loadStations,
		randomCountry,
		playStation,
		nextStation,
		prevStation,
		togglePlaying,
		changeVolume,
		toggleMuted
	};
}
