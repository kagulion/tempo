import { Pause, Play, Volume2, VolumeX } from 'lucide-react';

import { Button } from '@/components/ui/button';

type PlaybackControlsProps = {
	// Видео сейчас стоит
	stopped: boolean;
	onTogglePause: () => void;
	soundOn: boolean;
	onToggleSound: () => void;
};

// Кнопки в шапке окна, когда фон — видео (YouTube, ТВ): пауза и звук
export function PlaybackControls({
	stopped,
	onTogglePause,
	soundOn,
	onToggleSound
}: PlaybackControlsProps) {
	const pauseLabel = stopped ? 'Продолжить' : 'Пауза';
	const soundLabel = soundOn ? 'Выключить звук' : 'Включить звук';

	return (
		<>
			<Button
				variant="glass"
				size="icon-sm"
				onClick={onTogglePause}
				title={pauseLabel}
				aria-label={pauseLabel}
			>
				{stopped ? <Play /> : <Pause />}
			</Button>
			<Button
				variant="glass"
				size="icon-sm"
				onClick={onToggleSound}
				title={soundLabel}
				aria-label={soundLabel}
				aria-pressed={soundOn}
			>
				{soundOn ? <Volume2 /> : <VolumeX />}
			</Button>
		</>
	);
}
