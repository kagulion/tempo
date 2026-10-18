import { pinnedStreams, rutubeThumbUrl } from './pinned';
import { type RutubeStream, type RutubeTopicId, rutubeTopics } from './rutube';
import snapshotJson from './rutube-streams.json';
import { parseSnapshot } from './snapshot';

const snapshot = parseSnapshot(snapshotJson);

// Эфиры темы: ручной список (pinned.ts) важнее снимка (rutube-streams.json, его собирает pnpm rutube:snapshot).
// Нет ни того, ни другого — пустой список
export function streamsFor(topic: RutubeTopicId): RutubeStream[] {
	const pinned = pinnedStreams[topic];
	if (pinned) return pinned;
	return (snapshot[String(topic)] ?? []).map((stream) => ({
		...stream,
		thumbnail: rutubeThumbUrl(stream.id),
		hits: 0
	}));
}

// Темы с эфирами: пустую тему в окне не показываем
export const topicsWithStreams = rutubeTopics.filter((topic) => streamsFor(topic.id).length > 0);
