import { useEffect, useRef, useState } from 'react';

import { useAutoplay } from '@/hooks/useAutoplay';

import {
	detectCountryCode,
	fetchCountries,
	fetchStations,
	type RadioCountry,
	type Station
} from './api';

export type RadioStatus = 'idle' | 'loading' | 'empty' | 'error';

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
	const [playing, setPlaying] = useState(true);
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

	useEffect(() => {
		loadStations(country);
		loadCountries();
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

	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;
		audio.volume = volume;
		audio.muted = muted;
	}, [volume, muted]);

	useAutoplay(audioRef, station?.url_resolved, playing);

	return {
		// Свойства для элемента <audio>, который рендерит виджет
		audio: {
			ref: audioRef,
			src: station?.url_resolved,
			onEnded: nextStation,
			onPlaying: () => (failedStations.current = 0),
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
