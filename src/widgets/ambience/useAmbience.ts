import { useEffect, useState, useSyncExternalStore } from 'react';

import { useDuckLevel } from '@/hooks/useDuckLevel';
import { usePersistentState } from '@/hooks/usePersistentState';
import {
	getStatuses,
	pruneSoundCache,
	setAmbienceLevel,
	setSoundLevel,
	subscribeStatuses,
	unlockAmbience
} from '@/lib/ambience';
import { isRecord, storageKeys } from '@/lib/storage';

import { ambientGroups, ambientSounds, type AmbientSound } from './sounds';

// Пока звук не трогали, его ползунок на нуле
const defaultSoundVolume = 0;
// С какой громкостью включается звук, у которого ползунок на нуле, — иначе включилась бы тишина
const turnOnVolume = 0.5;

type AmbienceSettings = {
	volume: number;
	// Включённые звуки и громкость каждого. Громкость помним и у выключенных
	sounds: Record<string, { on: boolean; volume: number }>;
};

const defaultSettings: AmbienceSettings = { volume: 0.8, sounds: {} };

function parseSettings(saved: unknown): AmbienceSettings | undefined {
	if (!isRecord(saved)) return undefined;
	return {
		volume: typeof saved.volume === 'number' ? saved.volume : defaultSettings.volume,
		sounds: isRecord(saved.sounds) ? (saved.sounds as AmbienceSettings['sounds']) : {}
	};
}

// Вся логика фоновых звуков. Сам звук играет в src/lib/ambience.ts, разметка — в AmbienceWidget
export function useAmbience() {
	// Хранилище недоступно (приватный режим) — после перезагрузки начнём с чистого листа
	const [settings, setSettings] = usePersistentState(
		storageKeys.ambience,
		defaultSettings,
		parseSettings
	);
	// Как и радио, после перезагрузки звуки ждут нажатия: набор помним, но не играем
	const [playing, setPlaying] = useState(false);
	const statuses = useSyncExternalStore(subscribeStatuses, getStatuses);
	const duck = useDuckLevel();

	// Один раз при загрузке: выбрасываем из кэша файлы, которых больше нет в сборке
	useEffect(() => {
		const urls = ambientSounds.flatMap((sound) =>
			sound.source?.kind === 'file' ? [sound.source.url] : []
		);
		pruneSoundCache(urls).catch(() => {});
	}, []);

	useEffect(() => {
		ambientSounds.forEach((sound) => {
			const state = settings.sounds[sound.id];
			if (!sound.source) return;
			setSoundLevel(sound.id, sound.source, playing && state?.on ? state.volume : 0);
		});
	}, [settings.sounds, playing]);

	// Вокруг сигнала таймера звуки затихают вместе с радио
	useEffect(() => setAmbienceLevel(settings.volume * duck), [settings.volume, duck]);

	function withState(sound: AmbientSound) {
		return {
			...sound,
			available: Boolean(sound.source),
			on: settings.sounds[sound.id]?.on ?? false,
			volume: settings.sounds[sound.id]?.volume ?? defaultSoundVolume,
			status: statuses[sound.id]
		};
	}

	const groups = ambientGroups.map((group) => ({ ...group, sounds: group.sounds.map(withState) }));
	const anyOn = ambientSounds.some((sound) => sound.source && settings.sounds[sound.id]?.on);

	function updateSound(id: string, change: Partial<{ on: boolean; volume: number }>) {
		setSettings((current) => ({
			...current,
			sounds: {
				...current.sounds,
				[id]: { ...(current.sounds[id] ?? { on: false, volume: defaultSoundVolume }), ...change }
			}
		}));
	}

	function play() {
		unlockAmbience();
		setPlaying(true);
	}

	// Включённый звук при остановленном воспроизведении сразу запускает всё остальное
	function toggleSound(id: string) {
		const state = settings.sounds[id];
		const on = !(state?.on ?? false);
		const silent = (state?.volume ?? defaultSoundVolume) === 0;
		updateSound(id, on && silent ? { on, volume: turnOnVolume } : { on });
		if (on) play();
	}

	// Ползунок выключенного звука включает его — так быстрее, чем два нажатия. На нуле звук выключается
	function changeSoundVolume(id: string, volume: number) {
		updateSound(id, { volume, on: volume > 0 });
		if (volume > 0 && !playing) play();
	}

	function togglePlaying() {
		if (playing) setPlaying(false);
		else play();
	}

	function changeVolume(volume: number) {
		setSettings((current) => ({ ...current, volume }));
	}

	// Выключает все звуки и возвращает их ползунки на ноль. Общую громкость не трогает
	function resetSounds() {
		setSettings((current) => ({ ...current, sounds: {} }));
		setPlaying(false);
	}

	return {
		groups,
		playing: playing && anyOn,
		anyOn,
		// Сбрасывать нечего: ни один звук не трогали
		pristine: Object.keys(settings.sounds).length === 0,
		volume: settings.volume,
		toggleSound,
		changeSoundVolume,
		togglePlaying,
		changeVolume,
		resetSounds
	};
}
