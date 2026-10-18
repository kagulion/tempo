import { useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Widget } from '@/widgets/Widget';
import { applyAmbienceScene } from '@/widgets/ambience/useAmbience';
import { setActiveEffects } from '@/widgets/effects/useActiveEffects';
import { selectWallpaper } from '@/widgets/wallpaper/useWallpaper';
import { wallpapers } from '@/widgets/wallpaper/wallpapers';

import { scenes, type Scene } from './scenes';

type ScenesDialogProps = {
	// Закрыть окно: выбрали сцену или пропустили
	onFinish: () => void;
};

// Включает всё сразу: обои, звуки, эффекты. Вызывать из клика — это жест, звук можно запускать
function applyScene(scene: Scene) {
	selectWallpaper(scene.wallpaperId);
	applyAmbienceScene(scene.sounds);
	setActiveEffects(scene.effects);
}

const focusable = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

// Первый экран: стеклянная карточка поверх страницы с готовыми сценами. Esc и «Пропустить» закрывают без изменений.
// Пока карточка открыта, фокус не уходит за её пределы
export function ScenesDialog({ onFinish }: ScenesDialogProps) {
	const cardRef = useRef<HTMLElement>(null);

	// Обработчик меняется при каждой отрисовке: держим его в ref, чтобы слушатель не пересоздавался
	const finishRef = useRef(onFinish);
	useEffect(() => {
		finishRef.current = onFinish;
	});

	useEffect(() => {
		const previous = document.activeElement;
		cardRef.current?.querySelector<HTMLElement>(focusable)?.focus();

		function onKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				event.preventDefault();
				finishRef.current();
				return;
			}
			if (event.key !== 'Tab') return;
			const items = [...(cardRef.current?.querySelectorAll<HTMLElement>(focusable) ?? [])];
			if (items.length === 0) return;
			const first = items[0];
			const last = items[items.length - 1];
			const active = document.activeElement;
			if (!cardRef.current?.contains(active)) {
				event.preventDefault();
				first.focus();
			} else if (event.shiftKey && active === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && active === last) {
				event.preventDefault();
				first.focus();
			}
		}
		document.addEventListener('keydown', onKeyDown);
		return () => {
			document.removeEventListener('keydown', onKeyDown);
			if (previous instanceof HTMLElement) previous.focus();
		};
	}, []);

	return (
		<div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
			<Widget
				ref={cardRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby="scenes-title"
				aria-describedby="scenes-description"
				className="widget-window flex max-h-full w-full max-w-2xl scrollbar-glass flex-col gap-4 overflow-y-auto p-4 sm:p-6"
			>
				<div className="flex flex-col gap-1">
					<h2 id="scenes-title" className="text-lg font-medium">
						Добро пожаловать в Tempo
					</h2>
					<p id="scenes-description" className="text-sm text-white/60">
						Уютная комната для фокуса: обои, фоновые звуки, радио и таймер. Выберите готовую сцену
						или настройте сами.
					</p>
				</div>

				<ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
					{scenes.map((scene) => {
						const thumb = wallpapers.find((item) => item.id === scene.wallpaperId)?.thumb;
						return (
							<li key={scene.id} className="flex">
								<button
									type="button"
									onClick={() => {
										applyScene(scene);
										onFinish();
									}}
									className="group flex w-full flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-2 text-left transition-colors outline-none hover:bg-white/15 focus-visible:ring-3 focus-visible:ring-white/30"
								>
									<img
										src={thumb}
										alt=""
										className="aspect-video w-full rounded-lg object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
									/>
									<span className="px-0.5 text-sm font-medium">{scene.title}</span>
									<span className="px-0.5 text-xs text-white/60">{scene.description}</span>
								</button>
							</li>
						);
					})}
				</ul>

				<Button variant="glass" size="sm" onClick={onFinish} className="self-center text-white/60">
					Пропустить, настрою сам
				</Button>
			</Widget>
		</div>
	);
}
