import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { cn } from 'cn';

import { Widget } from '@/widgets/Widget';

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
	return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

type DialogContentProps = DialogPrimitive.Popup.Props & {
	// Затемнение фона: bg-black/40 и т. п.
	backdropClassName?: string;
};

// Стеклянное окно по центру страницы на затемнении. Ловушку фокуса, Esc, inert для страницы под окном
// и возврат фокуса делает Base UI
function DialogContent({ className, backdropClassName, children, ...props }: DialogContentProps) {
	return (
		<DialogPrimitive.Portal>
			<DialogPrimitive.Backdrop
				data-slot="dialog-backdrop"
				className={cn('fixed inset-0 z-30 bg-black/40', backdropClassName)}
			/>
			<DialogPrimitive.Viewport className="fixed inset-0 z-30 flex items-center justify-center p-4">
				<DialogPrimitive.Popup
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
