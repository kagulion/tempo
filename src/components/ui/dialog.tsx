import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { cn } from 'cn';
import { useCallback, useEffect } from 'react';

import { Widget } from '@/widgets/Widget';

// Сколько диалогов сейчас открыто: страница под ними неактивна, пока открыт хотя бы один
let openDialogs = 0;

function focusInsideDialog() {
	return !!document.activeElement?.closest('[data-slot="dialog-content"]');
}

// Base UI прячет страницу под модальным окном только через aria-hidden и data-base-ui-inert, а возврат
// фокуса в окно из focus-guard делает асинхронно (requestAnimationFrame). Если Tab нажимают чаще кадра,
// фокус успевает уйти на страницу под окном. Настоящий inert на корне это исключает сразу.
// Ставим его только когда фокус уже внутри окна: иначе кнопка, открывшая диалог, теряет фокус раньше, чем
// Base UI переведёт его в окно (initialFocus), фокус остаётся на body и Esc не работает.
// Диалоги и подсказки лежат в порталах вне #root, поэтому на них inert не влияет
function useInertPage(open: boolean | undefined) {
	useEffect(() => {
		if (!open) return;
		const root = document.getElementById('root');
		if (!root) return;
		let active = false;
		function activate() {
			if (active || !root) return;
			active = true;
			openDialogs += 1;
			root.inert = true;
			document.removeEventListener('focusin', onFocusIn, true);
		}
		function onFocusIn() {
			if (focusInsideDialog()) activate();
		}
		if (focusInsideDialog()) activate();
		else document.addEventListener('focusin', onFocusIn, true);
		return () => {
			document.removeEventListener('focusin', onFocusIn, true);
			if (!active || !root) return;
			openDialogs -= 1;
			if (openDialogs === 0) root.inert = false;
		};
	}, [open]);
}

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
	useInertPage(props.open);
	return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

type DialogContentProps = DialogPrimitive.Popup.Props & {
	// Затемнение фона: bg-black/40 и т. п.
	backdropClassName?: string;
};

// Стеклянное окно по центру страницы на затемнении. Ловушку фокуса, Esc, inert для страницы под окном
// и возврат фокуса делает Base UI
function DialogContent({ className, backdropClassName, children, ...props }: DialogContentProps) {
	// Если Base UI не успел поставить фокус в окно (бывает при открытии клавишей сразу после загрузки страницы),
	// фокус остался бы на body: Tab шёл бы по странице под окном, а Esc не закрывал бы его. Ставим фокус на само окно.
	// Колбэк-реф срабатывает при каждом появлении окна: сам DialogContent живёт и пока диалог закрыт
	const popupRef = useCallback((popup: HTMLDivElement | null) => {
		if (!popup) return;
		setTimeout(() => {
			if (popup.isConnected && !popup.contains(document.activeElement)) {
				popup.focus({ preventScroll: true });
			}
		}, 150);
	}, []);

	return (
		<DialogPrimitive.Portal>
			<DialogPrimitive.Backdrop
				data-slot="dialog-backdrop"
				className={cn('fixed inset-0 z-30 bg-black/40', backdropClassName)}
			/>
			<DialogPrimitive.Viewport className="fixed inset-0 z-30 flex items-center justify-center p-4">
				<DialogPrimitive.Popup
					ref={popupRef}
					data-slot="dialog-content"
					render={<Widget />}
					className={cn('widget-window outline-none', className)}
					{...props}
				>
					{children}
				</DialogPrimitive.Popup>
			</DialogPrimitive.Viewport>
		</DialogPrimitive.Portal>
	);
}

export { Dialog, DialogContent };
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;
export const DialogClose = DialogPrimitive.Close;
