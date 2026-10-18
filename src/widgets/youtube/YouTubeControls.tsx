import { Settings } from 'lucide-react';

import { Hint } from '@/components/Hint';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { mediaQueries } from '@/lib/media';
import { PlaybackControls } from '@/widgets/PlaybackControls';

import { isStopped } from './playback';
import { parseVideoQuality, videoQualities, videoQualityLabels } from './quality';
import { setPaused, useYouTubePlayback } from './youtubePlayback';

// Кнопки в шапке окна YouTube, когда фон — видео с YouTube: качество, пауза и звук
export function YouTubeControls() {
	const { paused, soundOn, toggleSound, quality, setQuality } = useYouTubePlayback();
	// При «уменьшить движение» видео по умолчанию стоит на первом кадре, но кнопкой его можно запустить
	const reducedMotion = useMediaQuery(mediaQueries.reducedMotion);
	const stopped = isStopped(paused, reducedMotion);
	const qualityLabel = `Качество: ${videoQualityLabels[quality]}`;

	return (
		<>
			<DropdownMenu>
				<Hint label={qualityLabel}>
					<DropdownMenuTrigger
						render={<Button variant="glass" size="icon-sm" aria-label={qualityLabel} />}
					>
						<Settings />
					</DropdownMenuTrigger>
				</Hint>
				<DropdownMenuContent align="end">
					<DropdownMenuGroup>
						{/* Плеер YouTube сам решает, какое качество взять: выбор — это потолок, а не точное значение */}
						<DropdownMenuLabel>Качество, не выше</DropdownMenuLabel>
						<DropdownMenuRadioGroup
							value={quality}
							onValueChange={(value) => {
								const next = parseVideoQuality(value);
								if (next) setQuality(next);
							}}
						>
							{videoQualities.map((item) => (
								<DropdownMenuRadioItem key={item} value={item}>
									{videoQualityLabels[item]}
								</DropdownMenuRadioItem>
							))}
						</DropdownMenuRadioGroup>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
			<PlaybackControls
				stopped={stopped}
				onTogglePause={() => setPaused(!stopped)}
				soundOn={soundOn}
				onToggleSound={toggleSound}
			/>
		</>
	);
}
