import { Pause, Play, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Widget } from '@/widgets/Widget';

import { type EffectId, effects } from './effects';

const buttonClass = 'text-white/80 hover:bg-white/15 hover:text-white';

type EffectsWidgetProps = {
	isActive: (id: EffectId) => boolean;
	onToggle: (id: EffectId) => void;
	anyActive: boolean;
	playing: boolean;
	onTogglePaused: () => void;
	onReset: () => void;
	className?: string;
};

// Окно эффектов: карточки-переключатели. Эффекты можно включать вместе.
// Сверху, как у звуков, сброс (выключить все) и пауза (заморозить на месте)
export function EffectsWidget({
	isActive,
	onToggle,
	anyActive,
	playing,
	onTogglePaused,
	onReset,
	className
}: EffectsWidgetProps) {
	return (
		<Widget aria-label="Эффекты" className={cn('flex flex-col gap-3 p-4', className)}>
			<div className="-my-1 flex items-center gap-1">
				<span className="text-xs font-medium text-white/60">Эффекты</span>
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={onReset}
					disabled={!anyActive}
					title="Выключить все эффекты"
					aria-label="Выключить все эффекты"
					className={cn(buttonClass, 'ml-auto')}
				>
					<RotateCcw />
				</Button>
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={onTogglePaused}
					disabled={!anyActive}
					title={playing ? 'Остановить эффекты' : 'Продолжить эффекты'}
					aria-label={playing ? 'Остановить эффекты' : 'Продолжить эффекты'}
					className={buttonClass}
				>
					{playing ? <Pause /> : <Play />}
				</Button>
			</div>

			<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
				{effects.map((effect) => {
					const Icon = effect.icon;
					const active = isActive(effect.id);
					return (
						<button
							key={effect.id}
							type="button"
							onClick={() => onToggle(effect.id)}
							aria-pressed={active}
							className={cn(
								'flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-1 py-3 text-xs font-medium text-white/60 transition-colors outline-none',
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
