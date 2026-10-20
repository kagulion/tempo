import { Pause, Play, Volume2, VolumeX } from 'lucide-react';

import { Button } from '@/components/ui/button';

type PlaybackControlsProps = {
	// Видео сейчас стоит
	stopped: boolean;
	onTogglePause: () => void;
	soundOn: boolean;
	onToggleSound: () => void;
};

// Кнопки паузы и звука в шапке окон с видео: YouTube и Twitch
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
			<Button variant="glass" size="icon-sm" onClick={onTogglePause} hint={pauseLabel}>
				{stopped ? <Play /> : <Pause />}
			</Button>
			<Button
				variant="glass"
				size="icon-sm"
				onClick={onToggleSound}
				hint={soundLabel}
				aria-pressed={soundOn}
			>
				{soundOn ? <Volume2 /> : <VolumeX />}
			</Button>
		</>
	);
}
