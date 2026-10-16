import { useMediaQuery } from '@/hooks/useMediaQuery';
import { mediaQueries } from '@/lib/media';
import { PlaybackControls } from '@/widgets/PlaybackControls';
import { isStopped } from '@/widgets/youtube/playback';
import { setPaused } from '@/widgets/youtube/youtubePlayback';

import { useTvPlayback } from './tvPlayback';

// Кнопки в шапке окна ТВ, когда фон — телеканал: пауза и звук
export function TvControls() {
	const { paused, soundOn, toggleSound } = useTvPlayback();
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
