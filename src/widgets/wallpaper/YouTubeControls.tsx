import { Pause, Play, Volume2, VolumeX } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { mediaQueries } from '@/lib/media';

import { isStopped } from './playback';
import { setPaused, useYouTubePlayback } from './youtubePlayback';

// Кнопки в шапке окна обоев, когда фон — видео с YouTube: пауза и звук
export function YouTubeControls() {
	const { paused, soundOn, toggleSound } = useYouTubePlayback();
	// При «уменьшить движение» видео по умолчанию стоит на первом кадре, но кнопкой его можно запустить
	const reducedMotion = useMediaQuery(mediaQueries.reducedMotion);
	const stopped = isStopped(paused, reducedMotion);
	const pauseLabel = stopped ? 'Продолжить' : 'Пауза';
	const soundLabel = soundOn ? 'Выключить звук' : 'Включить звук';

	return (
		<>
			<Button
				variant="glass"
				size="icon-sm"
				onClick={() => setPaused(!stopped)}
				title={pauseLabel}
				aria-label={pauseLabel}
			>
				{stopped ? <Play /> : <Pause />}
			</Button>
			<Button
				variant="glass"
				size="icon-sm"
				onClick={toggleSound}
				title={soundLabel}
				aria-label={soundLabel}
				aria-pressed={soundOn}
			>
				{soundOn ? <Volume2 /> : <VolumeX />}
			</Button>
		</>
	);
}
