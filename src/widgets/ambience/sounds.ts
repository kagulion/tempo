import {
	AudioLines,
	AudioWaveform,
	Beer,
	Bird,
	Bug,
	CloudLightning,
	CloudRain,
	Droplets,
	Fish,
	Flame,
	Snowflake,
	Trees,
	Waves,
	Wind,
	type LucideIcon
} from 'lucide-react';

import type { AmbienceSource } from '@/lib/ambience';

// Файлы звуков из src/assets/ambience/. Имя файла без расширения = id звука: rain.mp3 → «Дождь».
// Звук без файла показывается неактивным с подсказкой, какой файл положить
const files = import.meta.glob<string>('/src/assets/ambience/*.{mp3,m4a,ogg,opus,wav,webm}', {
	eager: true,
	query: '?url',
	import: 'default'
});

const fileUrls = new Map(
	Object.entries(files).map(([path, url]) => [path.replace(/^.*\/|\.\w+$/g, ''), url])
);

export type AmbientSound = {
	id: string;
	label: string;
	icon: LucideIcon;
	// undefined — файла ещё нет
	source?: AmbienceSource;
};

export type AmbientGroup = {
	label: string;
	sounds: AmbientSound[];
};

function file(id: string, label: string, icon: LucideIcon): AmbientSound {
	const url = fileUrls.get(id);
	return { id, label, icon, source: url ? { kind: 'file', url } : undefined };
}

export const ambientGroups: AmbientGroup[] = [
	{
		label: 'Таверна',
		sounds: [file('fireplace', 'Камин', Flame), file('tavern', 'Гул таверны', Beer)]
	},
	{
		label: 'Природа',
		sounds: [
			file('rain', 'Дождь', CloudRain),
			file('thunderstorm', 'Гроза', CloudLightning),
			file('wind', 'Ветер', Wind),
			file('blizzard', 'Метель', Snowflake),
			file('forest', 'Лес', Trees),
			file('birds', 'Птицы', Bird),
			file('crickets', 'Сверчки', Bug),
			file('stream', 'Ручей', Droplets),
			file('ocean', 'Океан', Waves),
			file('underwater', 'Под водой', Fish)
		]
	},
	{
		label: 'Шумы',
		sounds: [
			{
				id: 'white-noise',
				label: 'Белый шум',
				icon: AudioLines,
				source: { kind: 'noise', color: 'white' }
			},
			{
				id: 'pink-noise',
				label: 'Розовый шум',
				icon: AudioLines,
				source: { kind: 'noise', color: 'pink' }
			},
			{
				id: 'brown-noise',
				label: 'Коричневый шум',
				icon: AudioWaveform,
				source: { kind: 'noise', color: 'brown' }
			}
		]
	}
];

export const ambientSounds = ambientGroups.flatMap((group) => group.sounds);
