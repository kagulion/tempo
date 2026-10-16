import { useMediaQuery } from '@/hooks/useMediaQuery';
import { mediaQueries } from '@/lib/media';
import { PlaybackControls } from '@/widgets/PlaybackControls';

import { isStopped } from './playback';
import { setPaused, useYouTubePlayback } from './youtubePlayback';

// Кнопки в шапке окна YouTube, когда фон — видео с YouTube: пауза и звук
export function YouTubeControls() {
	const { paused, soundOn, toggleSound } = useYouTubePlayback();
	// При «уменьшить движение» видео по умолчанию стоит на первом кадре, но кнопкой его можно запустить
	const reducedMotion = useMediaQuery(mediaQueries.reducedMotion);
	const stopped = isStopped(paused, reducedMotion);

	return (
		<PlaybackControls
			stopped={stopped}
			onTogglePause={() => setPaused(!stopped)}
			soundOn={soundOn}
			onToggleSound={toggleSound}
		/>
	);
}
