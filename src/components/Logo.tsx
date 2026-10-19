import { cn } from '@/lib/utils';

// Логотип в левом верхнем углу с пометкой версии справа под ним. Положение задаёт родитель через className
export function Logo({ className }: { className?: string }) {
	return (
		<div className={cn('flex flex-col items-end gap-0.5 select-none', className)}>
			<img src="/logotype.svg" alt="Tempo" width={293} height={88} className="h-5 w-auto lg:h-6" />
			<span className="rounded-full bg-black/65 px-2 py-0.5 text-[0.6875rem] leading-none text-white/90 backdrop-blur-md">
				бета 0.1
			</span>
		</div>
	);
}
