import { cn } from '@/lib/utils';

type SwitchProps = {
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
	label: string;
	description?: string;
	className?: string;
};

// Переключатель-строка: подпись, пояснение и «бегунок». Это кнопка с role="switch", Tab и Пробел работают как у кнопки
export function Switch({ checked, onCheckedChange, label, description, className }: SwitchProps) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			onClick={() => onCheckedChange(!checked)}
			className={cn(
				'flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left text-xs font-medium text-white/80 transition-colors outline-none hover:border-white/25 hover:bg-white/10 hover:text-white focus-visible:ring-3 focus-visible:ring-white/20',
				className
			)}
		>
			<span className="flex flex-col gap-0.5">
				{label}
				{description && <span className="font-normal text-white/80">{description}</span>}
			</span>
			<span
				aria-hidden="true"
				className={cn(
					'relative h-5 w-9 shrink-0 rounded-full bg-white/15 transition-colors',
					checked && 'bg-white/40'
				)}
			>
				<span
					className={cn(
						'absolute top-0.5 left-0.5 size-4 rounded-full bg-white transition-transform motion-reduce:transition-none',
						checked && 'translate-x-4'
					)}
				/>
			</span>
		</button>
	);
}
