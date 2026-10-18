import { type TwitchChannel, type TwitchTopicId, twitchTopics } from './twitch';

function channel(login: string, title: string, author: string): TwitchChannel {
	return { login, title, author };
}

// Ручные списки каналов по темам, в порядке показа. Каналы проверены пробой (docs/twitch-spike.md): встраиваются,
// в эфире, автозапуск без звука работает. Круглосуточность не гарантирована. Чтобы добавить канал, впиши его в тему
const channels: Record<TwitchTopicId, TwitchChannel[]> = {
	music: [
		channel('lofigirl', 'Lofi Girl', 'lofi hip hop radio'),
		channel('chillhopradio', 'Chillhop Radio', 'jazzy & lofi hip hop'),
		channel('leekbeats', 'leekbeats', 'chill lofi beats'),
		channel('19barko', '19barko', 'Lofi & Chill'),
		channel('lofitape', 'LofiTape', 'lofi'),
		channel('relaxbeats', 'relaxbeats', 'chill / lofi')
	]
};

export function channelsFor(topic: TwitchTopicId): TwitchChannel[] {
	return channels[topic];
}

// Темы с каналами: пустую тему в окне не показываем
export const topicsWithChannels = twitchTopics.filter((topic) => channelsFor(topic.id).length > 0);
