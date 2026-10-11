import { CircleAlert, LoaderCircle, Pause, Play } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { Widget } from '@/widgets/Widget';

import { useAmbience } from './useAmbience';

const buttonClass = 'text-white/80 hover:bg-white/15 hover:text-white';

function percent(value: number) {
	return `${Math.round(value * 100)}%`;
}

type AmbienceWidgetProps = {
	className?: string;
};

export function AmbienceWidget({ className }: AmbienceWidgetProps) {
	const ambience = useAmbience();

	return (
		<Widget aria-label="Фоновые звуки" className={cn('flex flex-col gap-3 p-4', className)}>
			<div className="-my-1 flex items-center justify-between">
				<span className="text-xs font-medium text-white/60">Звуки</span>
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={ambience.togglePlaying}
					disabled={!ambience.anyOn}
					title={ambience.playing ? 'Остановить звуки' : 'Включить звуки'}
					aria-label={ambience.playing ? 'Остановить звуки' : 'Включить звуки'}
					className={buttonClass}
				>
					{ambience.playing ? <Pause /> : <Play />}
				</Button>
			</div>

			<div className="flex items-center gap-3">
				<span className="flex-1 text-sm font-medium">Громкость</span>
				<Slider
					aria-label="Общая громкость звуков"
					min={0}
					max={1}
					step={0.01}
					value={ambience.volume}
					onValueChange={ambience.changeVolume}
					className="w-24 shrink-0"
				/>
				<span className="w-9 shrink-0 text-right text-xs text-white/60 tabular-nums">
					{percent(ambience.volume)}
				</span>
			</div>

			{ambience.groups.map((group) => (
				<div
					key={group.label}
					role="group"
					aria-label={group.label}
					className="flex flex-col gap-0.5"
				>
					<span className="pb-1 text-[0.7rem] font-medium tracking-wider text-white/40 uppercase">
						{group.label}
					</span>

					{group.sounds.map((sound) => {
						const Icon = sound.icon;
						const active = sound.on && sound.available;
						const hint = sound.available
							? undefined
							: `Положите файл src/assets/ambience/${sound.id}.mp3`;

						return (
							<div
								key={sound.id}
								title={hint}
								className={cn(
									'flex items-center gap-3 transition-opacity',
									!active && 'opacity-50',
									!sound.available && 'opacity-30'
								)}
							>
								<button
									type="button"
									onClick={() => ambience.toggleSound(sound.id)}
									disabled={!sound.available}
									aria-pressed={active}
									className="-mx-1.5 flex h-8 min-w-0 flex-1 items-center gap-2 rounded-lg px-1.5 text-left text-sm font-medium transition-colors outline-none hover:bg-white/10 focus-visible:ring-3 focus-visible:ring-white/20 disabled:pointer-events-none"
								>
									{sound.status === 'loading' ? (
										<LoaderCircle className="size-4 shrink-0 animate-spin" />
									) : sound.status === 'error' ? (
										<CircleAlert className="size-4 shrink-0 text-red-300" />
									) : (
										<Icon className="size-4 shrink-0" />
									)}
									<span className="truncate">{sound.label}</span>
								</button>
								<Slider
									aria-label={`Громкость: ${sound.label}`}
									min={0}
									max={1}
									step={0.01}
									value={sound.volume}
									onValueChange={(value) => ambience.changeSoundVolume(sound.id, value)}
									disabled={!sound.available}
									className="w-24 shrink-0"
								/>
								<span className="w-9 shrink-0 text-right text-xs text-white/60 tabular-nums">
									{percent(sound.volume)}
								</span>
							</div>
						);
					})}
				</div>
			))}
		</Widget>
	);
}
