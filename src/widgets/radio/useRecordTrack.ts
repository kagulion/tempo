import { useEffect, useRef, useState } from 'react';

import type { RecordTrack } from './record';
import { fetchRecordNow } from './recordApi';
import { shouldPollTracks, trackPollDelay, type TrackPollResult } from './trackPolling';

// Трек, который сейчас играет на станции stationId. Опрашивает прокси, только пока радио играет
// и вкладка видна (расписание и пауза после неудач — в trackPolling.ts). Без ответа прокси — undefined
export function useRecordTrack(stationId: number | undefined, playing: boolean) {
	const [tracks, setTracks] = useState<RecordTrack[]>([]);
	// Итог последнего запроса переживает смену станции: пауза после неудачи не должна сбрасываться
	const last = useRef<TrackPollResult | null>(null);
	const requesting = useRef(false);

	useEffect(() => {
		if (stationId === undefined) return;
		let cancelled = false;
		let timer: ReturnType<typeof setTimeout> | undefined;

		function plan(immediate: boolean) {
			clearTimeout(timer);
			timer = undefined;
			if (!shouldPollTracks(playing, document.visibilityState === 'visible')) return;
			timer = setTimeout(poll, trackPollDelay(Date.now(), last.current, immediate));
		}

		async function poll() {
			timer = undefined;
			if (requesting.current) return;
			requesting.current = true;
			const found = await fetchRecordNow();
			requesting.current = false;
			last.current = { at: Date.now(), ok: found.length > 0 };
			if (cancelled) return;
			if (found.length > 0) setTracks(found);
			plan(false);
		}

		// Вкладка скрыта — опрос стоит, вернулись — спрашиваем сразу
		function handleVisibility() {
			plan(true);
		}

		// Смена станции или включение радио — повод спросить сразу
		plan(true);
		document.addEventListener('visibilitychange', handleVisibility);
		return () => {
			cancelled = true;
			clearTimeout(timer);
			document.removeEventListener('visibilitychange', handleVisibility);
		};
	}, [stationId, playing]);

	if (!playing || stationId === undefined) return undefined;
	return tracks.find((item) => item.stationId === stationId);
}
