import { PlaybackControls } from '@/widgets/PlaybackControls';

import { useTwitchSound } from './useTwitch';
import type { PlayerStatus } from './useTwitchPlayer';

// Кнопки в шапке окна Twitch, когда выбран канал: пауза и звук.
// Эфир на паузе, пока он не запущен, остановлен или Twitch сам поставил паузу: ▶ запускает его по клику
export function TwitchControls({
	status,
	onTogglePause
}: {
	status: PlayerStatus;
	onTogglePause: () => void;
}) {
	const { soundOn, toggleSound } = useTwitchSound();

	return (
		<PlaybackControls
			stopped={status !== 'playing'}
			onTogglePause={onTogglePause}
			soundOn={soundOn}
			onToggleSound={toggleSound}
		/>
	);
}
