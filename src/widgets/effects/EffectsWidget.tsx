import { Pause, Play, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useLiveWallpaper } from '@/widgets/wallpaper/liveWallpaper';
import { Widget, WidgetHeader } from '@/widgets/Widget';

import { effects } from './effects';
import { EffectsOffNotice } from './EffectsOffNotice';
import { useActiveEffects } from './useActiveEffects';

type EffectsWidgetProps = {
	className?: string;
};

// Окно эффектов: карточки-переключатели. Эффекты можно включать вместе.
// Сверху, как у звуков, сброс (выключить все) и пауза (заморозить на месте)
export function EffectsWidget({ className }: EffectsWidgetProps) {
	const { live, setLive } = useLiveWallpaper();
	const { isActive, toggle, anyActive, playing, togglePaused, reset } = useActiveEffects();

	return (
		<Widget aria-label="Эффекты" className={cn('flex flex-col gap-3 p-4', className)}>
			<WidgetHeader title="Эффекты">
				<Button
					variant="glass"
					size="icon-sm"
					onClick={reset}
					disabled={!anyActive}
					hint="Выключить все эффекты"
				>
					<RotateCcw />
				</Button>
				<Button
					variant="glass"
					size="icon-sm"
					onClick={togglePaused}
					disabled={!anyActive}
					hint={playing ? 'Остановить эффекты' : 'Продолжить эффекты'}
				>
					{playing ? <Pause /> : <Play />}
				</Button>
			</WidgetHeader>
			<EffectsOffNotice />

			{/* Видео-обои двигаются без остановки, поэтому их можно поставить на паузу (WCAG 2.2.2) */}
			<Switch
				checked={live}
				onCheckedChange={setLive}
				label="Живые обои"
				description="Видео-обои стоят на кадре, пока выключено"
			/>

			<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
				{effects.map((effect) => {
					const Icon = effect.icon;
					const active = isActive(effect.id);
					return (
						<button
							key={effect.id}
							type="button"
							onClick={() => toggle(effect.id)}
							aria-pressed={active}
							className={cn(
								'flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-1 py-3 text-xs font-medium text-white/80 transition-colors outline-none',
								'hover:border-white/25 hover:bg-white/10 hover:text-white focus-visible:ring-3 focus-visible:ring-white/20',
								active &&
									'border-white/30 bg-white/20 text-white hover:border-white/30 hover:bg-white/20'
							)}
						>
							<span
								className={cn(
									'flex size-10 items-center justify-center rounded-full bg-white/10 transition-colors',
									active && 'bg-white/25'
								)}
							>
								<Icon className="size-5" />
							</span>
							{effect.label}
						</button>
					);
				})}
			</div>
		</Widget>
	);
}
