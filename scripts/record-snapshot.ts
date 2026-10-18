// Обновляет снимок станций «Радио Рекорд»: pnpm record:snapshot
// Снимок нужен как запасной вариант, когда прокси на Supabase недоступен
import { writeFile } from 'node:fs/promises';

import { normalizeRecordStations } from '../src/widgets/radio/record.ts';

const res = await fetch('https://www.radiorecord.ru/api/stations/', {
	signal: AbortSignal.timeout(15000)
});
if (!res.ok) throw new Error(`HTTP ${res.status}`);

const stations = normalizeRecordStations(await res.json());
if (stations.length === 0) throw new Error('В ответе нет станций, снимок не обновлён');

const file = new URL('../src/widgets/radio/record-stations.json', import.meta.url);
await writeFile(file, `${JSON.stringify(stations, null, '\t')}\n`);
console.log(`Записано станций: ${stations.length}`);
