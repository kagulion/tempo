// Обновляет снимок эфиров Rutube по темам: pnpm rutube:snapshot
// Запускать из России: иностранным IP Rutube отдаёт урезанный каталог (нет Nat Geo, Discovery, Marvel и др.)
import { readFile, writeFile } from 'node:fs/promises';

import { pinnedStreams } from '../src/widgets/rutube/pinned.ts';
import { rutubeTopics } from '../src/widgets/rutube/rutube.ts';
import { parseSnapshot, type Snapshot } from '../src/widgets/rutube/snapshot.ts';
import { topStreams, upstreamLimit } from '../src/widgets/rutube/topStreams.ts';

const file = new URL('../src/widgets/rutube/rutube-streams.json', import.meta.url);

let snapshot: Snapshot = {};
try {
	snapshot = parseSnapshot(JSON.parse(await readFile(file, 'utf8')));
} catch {
	console.warn('Прежнего снимка нет или он испорчен: начинаем с пустого');
}

for (const { id, label } of rutubeTopics) {
	// Темы с ручным списком (pinned.ts) снимок не трогает
	if (pinnedStreams[id]) continue;

	try {
		const res = await fetch(`https://rutube.ru/api/video/topic/${id}/?limit=${upstreamLimit}`, {
			headers: { Accept: 'application/json' },
			signal: AbortSignal.timeout(15000)
		});
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const streams = topStreams(await res.json(), id);
		if (streams.length === 0) throw new Error('в ответе нет подходящих эфиров');
		snapshot[String(id)] = streams.map(({ id, title, author }) => ({ id, title, author }));
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		console.warn(`Тема «${label}» (${id}) не обновлена, остался прежний список: ${reason}`);
	}
}

await writeFile(file, `${JSON.stringify(snapshot, null, '\t')}\n`);
for (const { id, label } of rutubeTopics) {
	const count = pinnedStreams[id]?.length ?? snapshot[String(id)]?.length ?? 0;
	console.log(`${label}: ${count}${pinnedStreams[id] ? ' (ручной список)' : ''}`);
}
