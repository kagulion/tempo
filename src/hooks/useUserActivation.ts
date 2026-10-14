import { useEffect, useState } from 'react';

// Было ли на странице действие пользователя (клик, касание, клавиша). Пока не было, браузеры
// не дают включать звук у видео, поэтому звук ждёт этого момента
export function useUserActivation() {
	const [activated, setActivated] = useState(
		() => navigator.userActivation?.hasBeenActive ?? false
	);

	useEffect(() => {
		if (activated) return;

		function onInput() {
			// Не всякая клавиша считается действием (Shift, Esc): ждём настоящего
			if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
			setActivated(true);
		}

		// pointerup, а не pointerdown: на сенсорных экранах касание засчитывается при отпускании
		document.addEventListener('pointerup', onInput, true);
		document.addEventListener('keydown', onInput, true);
		return () => {
			document.removeEventListener('pointerup', onInput, true);
			document.removeEventListener('keydown', onInput, true);
		};
	}, [activated]);

	return activated;
}
