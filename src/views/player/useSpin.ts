import { useEffect, useRef, useSyncExternalStore, type RefObject } from 'react';

import { useMediaQuery } from '@/hooks/useMediaQuery';
import { mediaQueries } from '@/lib/media';

import { rampSpeed, scaledRampDuration, targetSpeed, type Rpm } from './spin';

export type SpinParams = {
	// Пластинка играет: разгоняется, иначе тормозит
	playing: boolean;
	rpm: Rpm;
	// Скорость воспроизведения видео
	rate: number;
};

function subscribeVisibility(listener: () => void) {
	document.addEventListener('visibilitychange', listener);
	return () => document.removeEventListener('visibilitychange', listener);
}

function isHidden() {
	return document.hidden;
}

// Крутит элемент через Web Animations API. Анимация одна, бесконечная, один оборот за секунду, а скорость
// меняется через playbackRate: так угол не прыгает при разгоне и торможении. Анимируется только transform.
// spin = undefined — пластинка стоит, анимации нет. «Уменьшить движение» — не крутим вовсе
export function useSpin(ref: RefObject<HTMLElement | null>, spin: SpinParams | undefined) {
	const reduced = useMediaQuery(mediaQueries.reducedMotion);
	const hidden = useSyncExternalStore(subscribeVisibility, isHidden);
	const enabled = spin !== undefined && !reduced;
	const animation = useRef<Animation | undefined>(undefined);
	// Текущая скорость в оборотах в секунду
	const speed = useRef(0);
	const frame = useRef<number | undefined>(undefined);

	useEffect(() => {
		const element = ref.current;
		if (!enabled || !element) return;
		const created = element.animate(
			[{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
			{ duration: 1000, iterations: Number.POSITIVE_INFINITY, easing: 'linear' }
		);
		created.pause();
		animation.current = created;
		speed.current = 0;
		return () => {
			created.cancel();
			animation.current = undefined;
		};
	}, [ref, enabled]);

	const playing = spin?.playing ?? false;
	const rpm = spin?.rpm ?? 33;
	const rate = spin?.rate ?? 1;

	useEffect(() => {
		const current = animation.current;
		if (!enabled || !current) return;

		function apply(value: number) {
			speed.current = value;
			if (!current) return;
			if (value <= 0.001) {
				speed.current = 0;
				current.pause();
				return;
			}
			current.playbackRate = value;
			if (current.playState !== 'running') current.play();
		}

		if (frame.current !== undefined) cancelAnimationFrame(frame.current);

		// В скрытой вкладке не крутим: кадры там всё равно не показываются
		if (hidden) {
			apply(0);
			return;
		}

		const from = speed.current;
		const to = targetSpeed(rpm, rate, playing);
		const full = targetSpeed(rpm, rate, true);
		const duration = scaledRampDuration(from, to, full);
		const startedAt = performance.now();

		function step(now: number) {
			apply(rampSpeed(from, to, now - startedAt, duration));
			frame.current = now - startedAt < duration ? requestAnimationFrame(step) : undefined;
		}
		step(startedAt);

		return () => {
			if (frame.current !== undefined) cancelAnimationFrame(frame.current);
			frame.current = undefined;
		};
	}, [enabled, playing, rpm, rate, hidden]);
}
