// Снимок эфиров по темам (rutube-streams.json): проверка прочитанного файла. Чистый модуль без React.
// Импорты с расширением .ts нужны Node: скрипт scripts/rutube-snapshot.ts запускается без сборки
import { rutubeTopics } from './rutube.ts';

// Эфир в снимке: превью строится по id (rutubeThumbUrl в pinned.ts), поэтому его в файле нет
export type SnapshotStream = { id: string; title: string; author: string };

export type Snapshot = Record<string, SnapshotStream[]>;

const idPattern = /^[0-9a-f]{32}$/;
const topicIds = new Set<string>(rutubeTopics.map((topic) => String(topic.id)));

// Файл мог испортиться или устареть: плохие элементы и неизвестные темы отбрасываем, остальное остаётся
export function parseSnapshot(raw: unknown): Snapshot {
	const result: Snapshot = {};
	if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return result;

	for (const [topic, list] of Object.entries(raw)) {
		if (!topicIds.has(topic) || !Array.isArray(list)) continue;
		const seen = new Set<string>();
		const streams: SnapshotStream[] = [];
		for (const item of list) {
			if (typeof item !== 'object' || item === null) continue;
			const { id, title, author } = item as Record<string, unknown>;
			if (typeof id !== 'string' || !idPattern.test(id) || seen.has(id)) continue;
			if (typeof title !== 'string' || title.trim() === '') continue;
			seen.add(id);
			streams.push({ id, title, author: typeof author === 'string' ? author : '' });
		}
		if (streams.length > 0) result[topic] = streams;
	}
	return result;
}
