import { useRef, useState } from 'react';

import { useAutoplay } from '@/hooks/useAutoplay';

import hearthsideLullaby from '@/assets/music/hearthside-lullaby.mp3';
import tavernBeforeBattle from '@/assets/music/tavern-before-battle.mp3';
import tavernTwilight from '@/assets/music/tavern-twilight.mp3';

// Список треков для фона
const playlist = [hearthsideLullaby, tavernBeforeBattle, tavernTwilight];

// Загруженная музыка по кругу, без элементов управления. Сейчас скрыта — см. musicEnabled в src/widgets/registry.ts
export function BackgroundMusic() {
	const audioRef = useRef<HTMLAudioElement>(null);
	const [currentTrack, setCurrentTrack] = useState(0);

	useAutoplay(audioRef, playlist[currentTrack], true);

	return (
		<audio
			ref={audioRef}
			src={playlist[currentTrack]}
			onEnded={() => setCurrentTrack((track) => (track + 1) % playlist.length)}
		/>
	);
}
