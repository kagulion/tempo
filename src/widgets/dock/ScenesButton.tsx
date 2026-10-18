import { Clapperboard } from 'lucide-react';

import { Hint } from '@/components/Hint';
import { hotkeyLabel } from '@/widgets/hotkeys/bindings';
import { openScenes } from '@/widgets/onboarding/scenesReopen';

type ScenesButtonProps = {
	className?: string;
};

// Кнопка в группе «Вид»: открывает экран с готовыми сценами снова. Это действие, а не переключатель.
// Стиль кнопки приходит из className (buttonClass в Dock.tsx). Видна и на телефоне
export function ScenesButton({ className }: ScenesButtonProps) {
	return (
		<Hint label="Сменить сцену" hotkey={hotkeyLabel('scenes')}>
			<button type="button" onClick={openScenes} aria-label="Сменить сцену" className={className}>
				<Clapperboard className="size-4" />
			</button>
		</Hint>
	);
}
