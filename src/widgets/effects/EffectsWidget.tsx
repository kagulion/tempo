import { cn } from '@/lib/utils';
import { Widget } from '@/widgets/Widget';

import { type EffectId, effects } from './effects';

type EffectsWidgetProps = {
	isActive: (id: EffectId) => boolean;
	onToggle: (id: EffectId) => void;
	className?: string;
};

// Окно эффектов: карточки-переключатели. Эффекты можно включать вместе
export function EffectsWidget({ isActive, onToggle, className }: EffectsWidgetProps) {
	return (
		<Widget aria-label="Эффекты" className={cn('flex flex-col gap-3 p-4', className)}>
			<span className="text-xs font-medium text-white/60">Эффекты</span>

			<div className="grid grid-cols-3 gap-2">
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
								'flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-4 text-sm font-medium text-white/60 transition-colors outline-none',
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
