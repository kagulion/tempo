import { Keyboard, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { Hint, Kbd } from '@/components/Hint';
import { Button } from '@/components/ui/button';
import { useClickSounds } from '@/lib/clickSound';
import { bindingName, hotkeyGroupLabels, type HotkeyGroup } from '@/lib/hotkeys';
import { cn } from '@/lib/utils';
import { Widget, WidgetHeader } from '@/widgets/Widget';

import { hotkeyBindings } from './bindings';

type HotkeysDialogProps = {
	open: boolean;
	onClose: () => void;
	// Открыть первый экран со сценами снова
	onOpenScenes: () => void;
};

const groups: HotkeyGroup[] = ['windows', 'view', 'other'];

// Окно со списком горячих клавиш и переключателем звуков нажатий. Закрывается по Esc, по клику мимо и по крестику.
// Закрытое не рисуется вовсе
export function HotkeysDialog({ open, onClose, onOpenScenes }: HotkeysDialogProps) {
	const clickSounds = useClickSounds();
	const closeRef = useRef<HTMLButtonElement>(null);

	// Обработчик меняется при каждой отрисовке: чтобы не ставить слушатель заново, держим его в ref
	const onCloseRef = useRef(onClose);
	useEffect(() => {
		onCloseRef.current = onClose;
	});

	useEffect(() => {
		if (!open) return;
		closeRef.current?.focus();
		function onKeyDown(event: KeyboardEvent) {
			if (event.key !== 'Escape') return;
			event.preventDefault();
			onCloseRef.current();
		}
		document.addEventListener('keydown', onKeyDown);
		return () => document.removeEventListener('keydown', onKeyDown);
	}, [open]);

	if (!open) return null;

	return (
		<div
			className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4"
			onClick={onClose}
		>
			<Widget
				role="dialog"
				aria-modal="true"
				aria-label="Горячие клавиши"
				onClick={(event) => event.stopPropagation()}
				className="widget-window flex max-h-full w-full max-w-md scrollbar-glass flex-col gap-4 overflow-y-auto p-4"
			>
				<WidgetHeader title="Горячие клавиши">
					<Button
						ref={closeRef}
						variant="glass"
						size="icon-sm"
						onClick={onClose}
						hint="Закрыть"
						hotkey="Esc"
					>
						<X />
					</Button>
				</WidgetHeader>

				{groups.map((group) => {
					const items = hotkeyBindings.filter((binding) => binding.group === group);
					if (items.length === 0) return null;
					return (
						<section key={group} className="flex flex-col gap-1.5">
							<h3 className="text-xs font-medium text-white/50">{hotkeyGroupLabels[group]}</h3>
							<ul className="flex flex-col gap-1">
								{items.map((binding) => (
									<li
										key={binding.action}
										className="flex items-center justify-between gap-3 text-sm"
									>
										<span>{binding.label}</span>
										<Kbd>{bindingName(binding)}</Kbd>
									</li>
								))}
							</ul>
						</section>
					);
				})}

				<div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3 text-sm">
					<span>Готовые сцены</span>
					<Button variant="glass-solid" size="sm" onClick={onOpenScenes}>
						Сменить сцену
					</Button>
				</div>

				<div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3 text-sm">
					<span id="click-sounds-label">Звуки нажатий</span>
					<button
						type="button"
						role="switch"
						aria-checked={clickSounds.enabled}
						aria-labelledby="click-sounds-label"
						onClick={clickSounds.toggle}
						className={cn(
							'relative h-5 w-9 shrink-0 rounded-full transition-colors outline-none focus-visible:ring-3 focus-visible:ring-white/20',
							clickSounds.enabled ? 'bg-white/60' : 'bg-white/15'
						)}
					>
						<span
							className={cn(
								'absolute top-0.5 left-0.5 size-4 rounded-full bg-white transition-transform',
								clickSounds.enabled && 'translate-x-4'
							)}
						/>
					</button>
				</div>
			</Widget>
		</div>
	);
}

type HotkeysButtonProps = {
	onClick: () => void;
	className?: string;
};

// Маленькая круглая кнопка, как у полного экрана. Открывает список клавиш
export function HotkeysButton({ onClick, className }: HotkeysButtonProps) {
	return (
		<Hint label="Горячие клавиши" hotkey="?" side="bottom">
			<button
				type="button"
				onClick={onClick}
				aria-label="Горячие клавиши"
				className={cn(
					'flex size-9 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white/70 shadow-2xl backdrop-blur-md transition-colors outline-none hover:bg-white/15 hover:text-white focus-visible:ring-3 focus-visible:ring-white/20',
					className
				)}
			>
				<Keyboard className="size-4" />
			</button>
		</Hint>
	);
}
