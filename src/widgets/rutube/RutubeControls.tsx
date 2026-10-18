import { useMediaQuery } from '@/hooks/useMediaQuery';
import { mediaQueries } from '@/lib/media';
import { PlaybackControls } from '@/widgets/PlaybackControls';
import { isStopped } from '@/widgets/youtube/playback';
import { setPaused } from '@/widgets/youtube/youtubePlayback';

import { launchEvent, useLaunchState, useRutubePlayback } from './useRutube';

// Кнопки в шапке окна Rutube, когда фон — эфир Rutube: пауза и звук.
// Пока эфир не начался, плеер игнорирует команды: «Play» тогда поднимает его поверх окон, чтобы нажать Play в нём самом
export function RutubeControls({ streamId }: { streamId: string }) {
	const { paused, soundOn, toggleSound } = useRutubePlayback();
	const { started } = useLaunchState(streamId);
	const reducedMotion = useMediaQuery(mediaQueries.reducedMotion);
	const stopped = !started || isStopped(paused, reducedMotion);

	return (
		<PlaybackControls
			stopped={stopped}
			onTogglePause={() =>
				started ? setPaused(!stopped) : launchEvent(streamId, { type: 'userStart' })
			}
			soundOn={soundOn}
			onToggleSound={toggleSound}
		/>
	);
}
