import { Sparkles, Volume2, VolumeOff } from 'lucide-react';

import { Hint } from '@/components/Hint';
import { Button } from '@/components/ui/button';
import { toggleSoundMuted, useSoundMuted } from '@/lib/soundMute';
import { cn } from '@/lib/utils';
import { toggleEffectsOff, useEffectsOff } from '@/widgets/effects/effectsOff';
import { hotkeyLabel } from '@/widgets/hotkeys/bindings';

// Половинка общей стеклянной пилюли. Включённый режим подсвечен
const partClass =
	'h-full w-8 rounded-none text-white/70 aria-pressed:bg-white/25 aria-pressed:text-white';

type QuietButtonsProps = {
	className?: string;
};

// «Без звука» и «Без эффектов» — одна стеклянная пилюля из двух кнопок-переключателей, в ряд с «Фокусом».
// Одна пилюля уже двух круглых кнопок: на 1024px угол не наезжает на окно таймера.
// Звук — src/lib/soundMute.ts, эффекты — src/widgets/effects/effectsOff.ts. Место на экране приходит в className
export function QuietButtons({ className }: QuietButtonsProps) {
	const muted = useSoundMuted();
	const effectsOff = useEffectsOff();
	const soundLabel = muted ? 'Вернуть звук' : 'Без звука';
	const effectsLabel = effectsOff ? 'Вернуть эффекты' : 'Без эффектов';

	return (
		<div
			className={cn(
				'flex h-9 items-center overflow-hidden rounded-full border border-white/10 bg-black/65 shadow-2xl backdrop-blur-md',
				className
			)}
		>
			<Hint label={soundLabel} hotkey={hotkeyLabel('soundMuted')} side="bottom">
				<Button
					variant="glass"
					size="icon-sm"
					onClick={toggleSoundMuted}
					aria-pressed={muted}
					aria-label={soundLabel}
					className={cn(partClass, 'pl-1')}
				>
					{muted ? <VolumeOff /> : <Volume2 />}
				</Button>
			</Hint>
			<Hint label={effectsLabel} hotkey={hotkeyLabel('effectsOff')} side="bottom">
				<Button
					variant="glass"
					size="icon-sm"
					onClick={toggleEffectsOff}
					aria-pressed={effectsOff}
					aria-label={effectsLabel}
					className={cn(partClass, 'relative pr-1')}
				>
					<Sparkles />
					{/* Перечёркнутые искры: у lucide нет иконки «без искр» */}
					{effectsOff && (
						<span
							aria-hidden="true"
							className="absolute h-0.5 w-5 rotate-45 rounded-full bg-current"
						/>
					)}
				</Button>
			</Hint>
		</div>
	);
}
