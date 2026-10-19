import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { mountWidget } from '@/widgets/dock/mountedWidgets';
import { applyAmbienceScene } from '@/widgets/ambience/useAmbience';
import { setActiveEffects } from '@/widgets/effects/useActiveEffects';
import { selectWallpaper } from '@/widgets/wallpaper/useWallpaper';
import { wallpapers } from '@/widgets/wallpaper/wallpapers';

import { scenes, type Scene } from './scenes';

type ScenesDialogProps = {
	open: boolean;
	// Закрыть окно: выбрали сцену или пропустили
	onFinish: () => void;
};

// Включает всё сразу: обои, звуки, эффекты. Вызывать из клика — это жест, звук можно запускать
function applyScene(scene: Scene) {
	selectWallpaper(scene.wallpaperId);
	// Звуки сцены играет окно звуков, даже закрытое: заказываем его загрузку
	mountWidget('ambience');
	applyAmbienceScene(scene.sounds);
	setActiveEffects(scene.effects);
}

// Куда вернуть фокус после закрытия: кнопка «Сменить сцену» в доке. При первом запуске окно открыто без кнопки,
// и вернуть фокус больше некуда. Нет кнопки (скрыт док) — Base UI вернёт его сам
function scenesButton() {
	return document.querySelector<HTMLElement>('[data-scenes-button]') ?? true;
}

// Первый экран: стеклянная карточка поверх страницы с готовыми сценами. Esc и «Пропустить» закрывают без изменений.
// Фокус, Esc и затемнение страницы под окном ведёт Base UI
export function ScenesDialog({ open, onFinish }: ScenesDialogProps) {
	// Окно, открытое с самой загрузки страницы (первый визит), появляется сразу, без проявления: пока оно прозрачно,
	// браузер не засчитывает его текст как отрисованный (LCP). Открытое позже из дока проявляется как обычно
	const [openedAtLoad, setOpenedAtLoad] = useState(open);
	if (!open && openedAtLoad) setOpenedAtLoad(false);
	return (
		<Dialog open={open} onOpenChange={(next) => !next && onFinish()}>
			<DialogContent
				backdropClassName="bg-black/50 backdrop-blur-sm"
				finalFocus={scenesButton}
				className={cn(
					'flex max-h-full w-full max-w-2xl scrollbar-glass flex-col gap-4 overflow-y-auto p-4 sm:p-6',
					openedAtLoad && 'transition-none'
				)}
			>
				<div className="flex flex-col gap-1">
					<DialogTitle render={<h2 />} className="text-lg font-medium">
						Добро пожаловать в Tempo
					</DialogTitle>
					<DialogDescription render={<p />} className="text-sm text-white/60">
						Уютная комната для фокуса: обои, фоновые звуки, радио и таймер. Выберите готовую сцену
						или настройте сами.
					</DialogDescription>
				</div>

				<ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
					{scenes.map((scene) => {
						const wallpaper = wallpapers.find((item) => item.id === scene.wallpaperId);
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
										src={wallpaper?.thumb}
										srcSet={wallpaper?.thumbSrcSet}
										// Плитка ~8rem с sm, на телефоне две колонки
										sizes="(min-width: 40rem) 8rem, 44vw"
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
			</DialogContent>
		</Dialog>
	);
}
