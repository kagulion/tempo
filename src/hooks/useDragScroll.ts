import { useEffect, type RefObject } from 'react';

import { exceedsDragThreshold, wheelScrollDelta } from '@/lib/dragScroll';

// Горизонтальная прокрутка ряда мышью: колесом и перетаскиванием. Сенсорный ввод не трогаем
export function useDragScroll(ref: RefObject<HTMLElement | null>) {
	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		let startX = 0;
		let startScroll = 0;
		let pointerId: number | undefined;
		let dragging = false;
		let suppressClick = false;

		function onWheel(event: WheelEvent) {
			const delta = wheelScrollDelta({
				deltaX: event.deltaX,
				deltaY: event.deltaY,
				scrollLeft: el!.scrollLeft,
				scrollWidth: el!.scrollWidth,
				clientWidth: el!.clientWidth
			});
			if (delta === 0) return;
			el!.scrollLeft += delta;
			event.preventDefault();
		}

		function onPointerDown(event: PointerEvent) {
			if (event.pointerType !== 'mouse' || event.button !== 0) return;
			suppressClick = false;
			pointerId = event.pointerId;
			startX = event.clientX;
			startScroll = el!.scrollLeft;
			dragging = false;
		}

		function onPointerMove(event: PointerEvent) {
			if (event.pointerId !== pointerId) return;
			const dx = event.clientX - startX;
			if (!dragging) {
				if (!exceedsDragThreshold(dx)) return;
				dragging = true;
				el!.setPointerCapture(event.pointerId);
				el!.style.cursor = 'grabbing';
			}
			el!.scrollLeft = startScroll - dx;
		}

		function endDrag(event: PointerEvent) {
			if (event.pointerId !== pointerId) return;
			if (dragging) {
				suppressClick = true;
				if (el!.hasPointerCapture(event.pointerId)) el!.releasePointerCapture(event.pointerId);
				el!.style.cursor = '';
			}
			dragging = false;
			pointerId = undefined;
		}

		// Клик в конце перетаскивания не должен выбирать жанр под курсором
		function onClick(event: MouseEvent) {
			if (!suppressClick) return;
			suppressClick = false;
			event.preventDefault();
			event.stopPropagation();
		}

		el.addEventListener('wheel', onWheel, { passive: false });
		el.addEventListener('pointerdown', onPointerDown);
		el.addEventListener('pointermove', onPointerMove);
		el.addEventListener('pointerup', endDrag);
		el.addEventListener('pointercancel', endDrag);
		el.addEventListener('click', onClick, true);
		return () => {
			el.removeEventListener('wheel', onWheel);
			el.removeEventListener('pointerdown', onPointerDown);
			el.removeEventListener('pointermove', onPointerMove);
			el.removeEventListener('pointerup', endDrag);
			el.removeEventListener('pointercancel', endDrag);
			el.removeEventListener('click', onClick, true);
		};
	}, [ref]);
}
