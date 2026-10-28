import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Hint } from '@/components/Hint';
import { cn } from '@/lib/utils';

export const buttonClass =
	'flex size-9 items-center justify-center rounded-full text-white/70 transition-colors outline-none hover:bg-white/15 hover:text-white focus-visible:ring-3 focus-visible:ring-white/20';

export type DockButton = {
	id: string;
	label: string;
	icon: LucideIcon;
	// Подпись клавиши для подсказки: «1», «K»
	hotkey?: string;
	// Окно открыто: кнопка подсвечена
	pressed: boolean;
	onClick: () => void;
	// Подгрузка чанка окна заранее: к клику он обычно уже готов
	onPointerEnter?: () => void;
	onFocus?: () => void;
};

export type DockGroupProps = {
	label: string;
	buttons: DockButton[];
	// Не окна, а что-то своё после кнопок: часы, звуки нажатий, смена сцены
	extra?: ReactNode;
};

// Группа кнопок: подпись над стеклянной пилюлей, в пилюле кнопки-переключатели. Подпись на телефоне слева, с sm по центру
export function DockGroup({ label, buttons, extra }: DockGroupProps) {
	return (
		<div className="flex flex-col items-start gap-1 sm:items-center">
			<span className="rounded-full bg-black/65 px-2.5 py-0.5 text-xs font-medium text-white/90 backdrop-blur-md">
				{label}
			</span>
			<div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/65 p-1 shadow-2xl backdrop-blur-md">
				{buttons.map((button) => {
					const Icon = button.icon;
					return (
						<Hint key={button.id} label={button.label} hotkey={button.hotkey}>
							<button
								type="button"
								onClick={button.onClick}
								onPointerEnter={button.onPointerEnter}
								onFocus={button.onFocus}
								aria-pressed={button.pressed}
								aria-label={button.label}
								className={cn(buttonClass, button.pressed && 'bg-white/20 text-white')}
							>
								<Icon className="size-4" />
							</button>
						</Hint>
					);
				})}
				{extra}
			</div>
		</div>
	);
}

type DockBarProps = {
	label: string;
	// Положение на экране задаёт тот, кто ставит панель
	className?: string;
	groups: (DockGroupProps & { id: string })[];
};

// Панель с группами кнопок. Общая для рабочего стола (Dock) и других страниц
export function DockBar({ label, className, groups }: DockBarProps) {
	return (
		<nav aria-label={label} className={cn('z-20 flex items-end gap-2 sm:gap-4', className)}>
			{groups.map(({ id, ...group }) => (
				<DockGroup key={id} {...group} />
			))}
		</nav>
	);
}
