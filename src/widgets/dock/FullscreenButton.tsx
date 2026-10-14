import { Maximize, Minimize } from 'lucide-react';
import { useSyncExternalStore } from 'react';

import { cn } from '@/lib/utils';

function subscribe(listener: () => void) {
	document.addEventListener('fullscreenchange', listener);
	return () => document.removeEventListener('fullscreenchange', listener);
}

function isFullscreen() {
	return document.fullscreenElement !== null;
}

type FullscreenButtonProps = {
	className?: string;
};

// Полноэкранный режим страницы, как F11. Отдельная круглая кнопка; место на экране приходит в className.
// На iPhone Fullscreen API нет — кнопку не показываем
export function FullscreenButton({ className }: FullscreenButtonProps) {
	const fullscreen = useSyncExternalStore(subscribe, isFullscreen);

	if (!document.fullscreenEnabled) return null;

	function toggle() {
		// Браузер может отказать, например если запрос пришёл не от клика. Тогда просто ничего не меняем
		const request = fullscreen
			? document.exitFullscreen()
			: document.documentElement.requestFullscreen();
		request.catch(() => {});
	}

	const label = fullscreen ? 'Выйти из полноэкранного режима' : 'На весь экран';
	const Icon = fullscreen ? Minimize : Maximize;

	return (
		<button
			type="button"
			onClick={toggle}
			aria-pressed={fullscreen}
			title={label}
			aria-label={label}
			className={cn(
				'flex size-9 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white/70 shadow-2xl backdrop-blur-md transition-colors outline-none hover:bg-white/15 hover:text-white focus-visible:ring-3 focus-visible:ring-white/20',
				className
			)}
		>
			<Icon className="size-4" />
		</button>
	);
}
