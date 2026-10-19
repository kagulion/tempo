import { Keyboard, X } from 'lucide-react';
import { useRef } from 'react';

import { Hint, Kbd } from '@/components/Hint';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { bindingName, hotkeyGroupLabels, type HotkeyGroup } from '@/lib/hotkeys';
import { useSiteHotkeys } from '@/lib/siteHotkeys';
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
	const siteHotkeys = useSiteHotkeys();
	return (
		<Dialog open={open} onOpenChange={(next) => !next && onClose()}>
			<DialogContent
				className="flex max-h-full w-full max-w-md scrollbar-glass flex-col gap-4 overflow-y-auto p-4"
				initialFocus={closeRef}
			>
				<WidgetHeader
					heading={false}
					title={<DialogTitle render={<h2 />}>Горячие клавиши</DialogTitle>}
				>
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

				{/* WCAG 2.1.4: одиночные символьные клавиши можно отключить */}
				<Switch
					checked={siteHotkeys.enabled}
					onCheckedChange={siteHotkeys.setEnabled}
					label="Клавиши сайта"
					description="Одиночные клавиши из списка ниже. Выключите, если они мешают диктовке или экранному диктору"
				/>

				{groups.map((group) => {
					const items = hotkeyBindings.filter((binding) => binding.group === group);
					if (items.length === 0) return null;
					return (
						<section
							key={group}
							className="flex flex-col gap-1.5"
							data-disabled={!siteHotkeys.enabled || undefined}
						>
							<h3 className="text-xs font-medium text-white/80">{hotkeyGroupLabels[group]}</h3>
							<ul
								className="flex flex-col gap-1"
								aria-label={
									siteHotkeys.enabled ? undefined : `${hotkeyGroupLabels[group]}: клавиши выключены`
								}
							>
								{items.map((binding) => (
									<li
										key={binding.action}
										className="flex items-center justify-between gap-3 text-sm"
									>
										<span className={cn(!siteHotkeys.enabled && 'text-white/80')}>
											{binding.label}
										</span>
										<span
											className={cn(!siteHotkeys.enabled && 'line-through decoration-white/60')}
										>
											<Kbd>{bindingName(binding)}</Kbd>
										</span>
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
