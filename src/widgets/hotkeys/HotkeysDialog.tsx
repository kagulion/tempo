import { Keyboard, X } from 'lucide-react';
import { useRef } from 'react';

import { Hint, Kbd } from '@/components/Hint';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { bindingName, hotkeyGroupLabels, type HotkeyGroup } from '@/lib/hotkeys';
import { cn } from '@/lib/utils';
import { WidgetHeader } from '@/widgets/Widget';

import { hotkeyBindings } from './bindings';

type HotkeysDialogProps = {
	open: boolean;
	onClose: () => void;
};

const groups: HotkeyGroup[] = ['windows', 'view', 'other'];

// Окно со списком горячих клавиш. Закрывается по Esc, по клику мимо и по крестику.
// Фокус, Esc и возврат фокуса на кнопку, что открыла окно, ведёт Base UI
export function HotkeysDialog({ open, onClose }: HotkeysDialogProps) {
	const closeRef = useRef<HTMLButtonElement>(null);
	return (
		<Dialog open={open} onOpenChange={(next) => !next && onClose()}>
			<DialogContent
				className="flex max-h-full w-full max-w-md scrollbar-glass flex-col gap-4 overflow-y-auto p-4"
				initialFocus={closeRef}
			>
				<WidgetHeader title={<DialogTitle render={<span />}>Горячие клавиши</DialogTitle>}>
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
			</DialogContent>
		</Dialog>
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
					'flex size-9 items-center justify-center rounded-full border border-white/10 bg-black/65 text-white/70 shadow-2xl backdrop-blur-md transition-colors outline-none hover:bg-white/15 hover:text-white focus-visible:ring-3 focus-visible:ring-white/20',
					className
				)}
			>
				<Keyboard className="size-4" />
			</button>
		</Hint>
	);
}
