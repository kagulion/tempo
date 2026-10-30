import {
	Loader2,
	Pause,
	Play,
	Repeat,
	Repeat1,
	SkipBack,
	SkipForward,
	Tv,
	Volume2,
	VolumeX
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuGroup,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';
import { Widget } from '@/widgets/Widget';

import { formatTime } from './progress';
import { playbackRates, repeatLabels, type PlayerSettings, type RepeatMode } from './settings';
import type { PlayerStatus } from './usePlayer';

type ControlsProps = {
	title: string;
	status: PlayerStatus;
	time: number;
	duration: number;
	settings: PlayerSettings;
	canSkip: boolean;
	onToggle: () => void;
	onSeek: (seconds: number) => void;
	onPrevious: () => void;
	onNext: () => void;
	onChange: (patch: Partial<PlayerSettings>) => void;
	className?: string;
};

const nextRepeat: Record<RepeatMode, RepeatMode> = { off: 'all', all: 'one', one: 'off' };

function rateLabel(rate: number) {
	return `${rate}×`;
}

// Пульт: название, перемотка, кнопки, скорость, повтор, громкость
export function Controls({
	title,
	status,
	time,
	duration,
	settings,
	canSkip,
	onToggle,
	onSeek,
	onPrevious,
	onNext,
	onChange,
	className
}: ControlsProps) {
	// Пока ползунок тянут, показываем его значение, а перематываем в конце: иначе видео дёргалось бы на каждом шаге
	const [dragging, setDragging] = useState<number>();
	const shown = dragging ?? Math.min(time, duration || time);
	const playing = status === 'playing';
	const busy = status === 'loading' || status === 'buffering';
	const silent = settings.muted || settings.volume === 0;
	const RepeatIcon = settings.repeat === 'one' ? Repeat1 : Repeat;

	return (
		<Widget className={`flex w-full max-w-xl flex-col gap-3 p-4 ${className ?? ''}`}>
			<p className="truncate text-center text-sm font-medium" title={title}>
				{title}
			</p>

			<div className="flex items-center gap-2 text-xs text-white/80 tabular-nums">
				<span className="w-12 text-right">{formatTime(shown)}</span>
				<Slider
					label="Перемотка"
					min={0}
					max={Math.max(duration, 1)}
					step={1}
					value={shown}
					disabled={duration <= 0}
					formatValue={formatTime}
					onValueChange={(value) => setDragging(value)}
					onValueCommitted={(value) => {
						setDragging(undefined);
						onSeek(value);
					}}
				/>
				<span className="w-12">{formatTime(duration)}</span>
			</div>

			<div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-3">
				<Button
					variant="glass"
					size="icon-sm"
					title="Предыдущая пластинка"
					aria-label="Предыдущая пластинка"
					disabled={!canSkip}
					onClick={onPrevious}
				>
					<SkipBack />
				</Button>
				<Button
					variant="glass-solid"
					size="icon-lg"
					title={playing ? 'Пауза' : 'Играть'}
					aria-label={playing ? 'Пауза' : 'Играть'}
					disabled={status === 'idle'}
					onClick={onToggle}
				>
					{busy ? <Loader2 className="animate-spin" /> : playing ? <Pause /> : <Play />}
				</Button>
				<Button
					variant="glass"
					size="icon-sm"
					title="Следующая пластинка"
					aria-label="Следующая пластинка"
					disabled={!canSkip}
					onClick={onNext}
				>
					<SkipForward />
				</Button>

				<span aria-hidden className="mx-1 h-5 w-px bg-white/15" />

				<Button
					variant="glass"
					size="icon-sm"
					title={`Повтор: ${repeatLabels[settings.repeat].toLowerCase()}`}
					aria-label={`Повтор: ${repeatLabels[settings.repeat].toLowerCase()}`}
					onClick={() => onChange({ repeat: nextRepeat[settings.repeat] })}
				>
					<RepeatIcon className={settings.repeat === 'off' ? 'opacity-40' : undefined} />
				</Button>

				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<Button
								variant="glass"
								size="sm"
								title="Скорость воспроизведения"
								aria-label={`Скорость воспроизведения: ${rateLabel(settings.rate)}`}
							/>
						}
					>
						{rateLabel(settings.rate)}
					</DropdownMenuTrigger>
					<DropdownMenuContent align="center" side="top">
						<DropdownMenuGroup>
							<DropdownMenuLabel>Скорость</DropdownMenuLabel>
							<DropdownMenuRadioGroup
								value={String(settings.rate)}
								onValueChange={(value) => onChange({ rate: Number(value) })}
							>
								{playbackRates.map((rate) => (
									<DropdownMenuRadioItem key={rate} value={String(rate)}>
										{rateLabel(rate)}
									</DropdownMenuRadioItem>
								))}
							</DropdownMenuRadioGroup>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>

				<Button
					variant="glass"
					size="icon-sm"
					title={settings.showVideo ? 'Скрыть видео' : 'Показать видео'}
					aria-label={settings.showVideo ? 'Скрыть видео' : 'Показать видео'}
					aria-pressed={settings.showVideo}
					onClick={() => onChange({ showVideo: !settings.showVideo })}
				>
					<Tv className={settings.showVideo ? undefined : 'opacity-50'} />
				</Button>

				{/* Громкость справа от всех кнопок; маленький ползунок, как в радио */}
				<div className="flex items-center gap-1">
					<Button
						variant="glass"
						size="icon-sm"
						title={silent ? 'Включить звук' : 'Выключить звук'}
						aria-label={silent ? 'Включить звук' : 'Выключить звук'}
						aria-pressed={settings.muted}
						onClick={() => onChange({ muted: !settings.muted })}
					>
						{silent ? <VolumeX /> : <Volume2 />}
					</Button>
					<Slider
						label="Громкость"
						min={0}
						max={100}
						step={1}
						value={settings.muted ? 0 : settings.volume}
						onValueChange={(value) => onChange({ volume: value, muted: false })}
						className="w-16 min-w-8 sm:w-20"
					/>
				</div>
			</div>
		</Widget>
	);
}
