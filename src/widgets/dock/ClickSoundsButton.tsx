import { MousePointerClick } from 'lucide-react';

import { Hint } from '@/components/Hint';
import { useClickSounds } from '@/lib/clickSound';
import { cn } from '@/lib/utils';
import { hotkeyLabel } from '@/widgets/hotkeys/bindings';

type ClickSoundsButtonProps = {
	className?: string;
};

// Кнопка-переключатель звуков нажатий в группе «Звук». Состояние — src/lib/clickSound.ts.
// Стиль кнопки приходит из className (buttonClass в Dock.tsx). Видна и на телефоне
export function ClickSoundsButton({ className }: ClickSoundsButtonProps) {
	const clickSounds = useClickSounds();
	const label = clickSounds.enabled ? 'Выключить звуки нажатий' : 'Звуки нажатий';

	return (
		<Hint label={label} hotkey={hotkeyLabel('clickSounds')}>
			<button
				type="button"
				onClick={clickSounds.toggle}
				aria-pressed={clickSounds.enabled}
				aria-label="Звуки нажатий"
				className={cn(className, clickSounds.enabled && 'bg-white/20 text-white')}
			>
				<MousePointerClick className="size-4" />
			</button>
		</Hint>
	);
}
