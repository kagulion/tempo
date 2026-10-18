import type { RutubeStream, RutubeTopicId } from './rutube.ts';

// Превью эфира: Rutube отвечает 302 на картинку pic.rtbcdn.ru
export function rutubeThumbUrl(id: string) {
	return `https://rutube.ru/api/video/${id}/thumbnail/?redirect=1`;
}

function pinned(id: string, title: string, author: string): RutubeStream {
	return { id, title, author, thumbnail: rutubeThumbUrl(id), hits: 0 };
}

// Ручные списки эфиров по темам. Они важнее снимка (rutube-streams.json, его собирает pnpm rutube:snapshot): для такой темы список
// берётся отсюда, порядок как в списке (не больше 6), скрипт её не трогает. Чтобы добавить тему, достаточно вписать её сюда
export const pinnedStreams: Partial<Record<RutubeTopicId, RutubeStream[]>> = {
	// Музыка
	8: [
		pinned('df6fe73494a26f74da51573fd97b9baa', 'МУЗ-ТВ', 'МУЗ-ТВ'),
		pinned('bc1b811349f526188c839d377913e16a', 'Kronehit TV', 'Телеканалы мира онлайн'),
		pinned('f712ae5ff3db23ec09b3674133d44daa', 'VIVA Russia', 'VIVA RUSSIA'),
		pinned('8e9da41366fcb497aaeade579f0d715f', 'ActivaTV', 'Телеканалы мира онлайн'),
		pinned('e7e04192431a24a750fd8704fa221461', 'Музыкальные клипы 24/7', 'Музач'),
		pinned('b1eb8e90d7e636677b3eb73b4fcbb717', 'РУ.ТВ', 'РУ.ТВ')
	]
};
