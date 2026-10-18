// Клиент «Радио Рекорд» через Edge Function на Supabase (supabase/functions/record).
// Сам API Рекорда закрыт для браузера по CORS
import { getSupabaseUrl } from '@/lib/supabase';

import {
	normalizeRecordNow,
	normalizeRecordStations,
	type RecordStation,
	type RecordTrack
} from './record';
import { snapshotStations } from './saved';

const baseUrl = getSupabaseUrl(import.meta.env.VITE_SUPABASE_URL as string | undefined);
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY as string | undefined;

async function request(path: string): Promise<unknown> {
	if (!baseUrl) throw new Error('Supabase не настроен');
	const res = await fetch(`${baseUrl}/functions/v1/record${path}`, {
		headers: supabaseKey ? { apikey: supabaseKey } : undefined,
		signal: AbortSignal.timeout(5000)
	});
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	return res.json();
}

// Прокси не настроен, не ответил или вернул пустой список — отдаём станции из снимка
export async function fetchRecordStations(): Promise<RecordStation[]> {
	try {
		const stations = normalizeRecordStations(await request('/stations'));
		if (stations.length > 0) return stations;
	} catch {
		// Ниже вернём снимок
	}
	return snapshotStations;
}

// Что сейчас играет. При любой ошибке — пустой список, радио работает и без этого
export async function fetchRecordNow(): Promise<RecordTrack[]> {
	try {
		return normalizeRecordNow(await request('/now'));
	} catch {
		return [];
	}
}
