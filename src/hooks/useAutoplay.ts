import { useEffect, type RefObject } from 'react';

import { unlockAudio } from '@/lib/audio';

// Играет src, пока playing = true. Браузеры блокируют звук до первого взаимодействия со страницей —
// в этом случае запускаем воспроизведение по первому клику или нажатию клавиши
export function useAutoplay(
	audioRef: RefObject<HTMLAudioElement | null>,
	src: string | undefined,
	playing: boolean
) {
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;
		// Звук выключен или источник ещё не готов — глушим то, что играло до этого
		if (!src || !playing) {
			audio.pause();
			return;
		}

		const listeners = new AbortController();

		// Пробуем запустить воспроизведение сразу
		audio.play().catch(() => {
			const startAudio = () => {
				// Заодно разблокируем AudioContext: через него идёт анализатор эквалайзера
				unlockAudio();
				audio.play().catch(() => {});
				listeners.abort();
			};

			window.addEventListener('click', startAudio, { signal: listeners.signal });
			window.addEventListener('keydown', startAudio, { signal: listeners.signal });
		});

		return () => listeners.abort();
	}, [audioRef, src, playing]);
}
