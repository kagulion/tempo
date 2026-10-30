// Разбор того, что посетители сохранили в localStorage раньше. Если тут что-то сломается,
// у старых посетителей молча сбросятся обои, эффекты или открытые окна
import { describe, expect, it } from 'vitest';

import { parsePosition } from './clock/useBigClock';
import { parseDimmer } from './dimmer/dimmer';
import { parseOpen } from './dock/useDock';
import { parseSort, parseSource, parseStation, parseStationMap } from './radio/saved';
import { initialState, parseState } from './effects/useActiveEffects';
import { parseEffectsOff } from './effects/effectsOff';
import { parseSiteHotkeys } from '@/lib/siteHotkeys';
import { parseSoundMuted } from '@/lib/soundMute';
import { parseMood } from './stats/mood';
import { parseLiveWallpaper, resolveLive } from './wallpaper/liveWallpaper';
import { parseSaved } from './wallpaper/useWallpaper';
import { parseSavedChannel } from './twitch/twitch';
import { parseCategories as parsePlayerCategories } from '@/views/player/categories';
import { parseCollection as parsePlayerCollection } from '@/views/player/collection';
import { parseSettings as parsePlayerSettings } from '@/views/player/settings';
import { parseSoundOn } from './youtube/playback';
import { parseVideoQuality } from './youtube/quality';
import { parseHistory } from './youtube/youtube';

describe('обои', () => {
	it('читает текущий формат', () => {
		expect(parseSaved({ id: 'warcraft/booty-bay' })).toEqual({ id: 'warcraft/booty-bay' });
	});

	it('переводит старый формат { faction, indexes } в id', () => {
		expect(parseSaved({ faction: 'alliance', indexes: { alliance: 2 } })).toEqual({
			id: 'alliance/elfs-tavern'
		});
		expect(parseSaved({ faction: 'horde' })).toEqual({ id: 'horde/orcs-tavern' });
	});

	it('читает видео с YouTube по id вида youtube/<id видео>', () => {
		expect(parseSaved({ id: 'youtube/dQw4w9WgXcQ' })).toEqual({ id: 'youtube/dQw4w9WgXcQ' });
	});

	it('удалённый Rutube: id rutube/<id> превращается в обои по умолчанию', () => {
		expect(parseSaved({ id: 'rutube/546602986e6a424d74d594876ddb3f04' })).toBeUndefined();
		expect(parseSaved({ id: 'rutube/' })).toBeUndefined();
	});

	it('старый телеканал tv/<id> превращается в обои по умолчанию', () => {
		expect(parseSaved({ id: 'tv/Some.channel' })).toBeUndefined();
		expect(parseSaved({ id: 'tv/' })).toBeUndefined();
	});

	it('неизвестные обои и мусор отбрасывает', () => {
		expect(parseSaved({ id: 'youtube/short' })).toBeUndefined();
		expect(parseSaved({ id: 'youtube/dQw4w9WgXcQ/extra' })).toBeUndefined();
		expect(parseSaved({ id: 'removed/wallpaper' })).toBeUndefined();
		expect(parseSaved({ faction: 'scourge' })).toBeUndefined();
		expect(parseSaved('horde')).toBeUndefined();
	});
});

describe('история видео YouTube', () => {
	it('читает сохранённый список', () => {
		expect(parseHistory([{ videoId: 'dQw4w9WgXcQ', title: 'Клип', start: 30 }])).toEqual([
			{ videoId: 'dQw4w9WgXcQ', title: 'Клип', start: 30 }
		]);
	});

	it('плохие элементы отбрасывает, годные оставляет', () => {
		expect(parseHistory([{ videoId: 'bad' }, null, { videoId: 'dQw4w9WgXcQ' }])).toEqual([
			{ videoId: 'dQw4w9WgXcQ' }
		]);
	});

	it('не список отбрасывает', () => {
		expect(parseHistory({ videoId: 'dQw4w9WgXcQ' })).toBeUndefined();
	});
});

describe('звук видео (YouTube и Twitch)', () => {
	it('читает сохранённый выбор', () => {
		expect(parseSoundOn(true)).toBe(true);
		expect(parseSoundOn(false)).toBe(false);
	});

	it('мусор отбрасывает', () => {
		expect(parseSoundOn('true')).toBeUndefined();
		expect(parseSoundOn({ on: true })).toBeUndefined();
		expect(parseSoundOn(null)).toBeUndefined();
	});
});

describe('качество видео YouTube', () => {
	it('читает сохранённый выбор', () => {
		expect(parseVideoQuality('auto')).toBe('auto');
		expect(parseVideoQuality('720')).toBe('720');
	});

	it('мусор и неизвестные варианты отбрасывает', () => {
		expect(parseVideoQuality('hd720')).toBeUndefined();
		expect(parseVideoQuality(1080)).toBeUndefined();
		expect(parseVideoQuality(null)).toBeUndefined();
	});
});

describe('эффекты', () => {
	it('читает текущий формат', () => {
		expect(parseState({ active: ['rain', 'snow'], paused: true })).toEqual({
			active: ['rain', 'snow'],
			paused: true
		});
	});

	it('переводит старый формат — массив включённых id', () => {
		expect(parseState(['snow'])).toEqual({ active: ['snow'], paused: false });
	});

	it('убирает удалённые эффекты и держит порядок списка эффектов', () => {
		expect(parseState({ active: ['snow', 'removed', 'embers'] })).toEqual({
			active: ['embers', 'snow'],
			paused: false
		});
	});

	it('мусор отбрасывает', () => {
		expect(parseState('rain')).toBeUndefined();
		expect(parseState(null)).toBeUndefined();
	});
});

describe('позиция крупных часов', () => {
	it('читает центр и угол', () => {
		expect(parsePosition('center')).toBe('center');
		expect(parsePosition('corner')).toBe('corner');
	});

	it('мусор отбрасывает', () => {
		expect(parsePosition('left')).toBeUndefined();
		expect(parsePosition(true)).toBeUndefined();
		expect(parsePosition(null)).toBeUndefined();
	});
});

describe('открытые окна', () => {
	it('убирает удалённые виджеты и сохраняет порядок открытия', () => {
		expect(parseOpen(['timer', 'removed', 'radio'])).toEqual(['timer', 'radio']);
	});

	it('мусор отбрасывает', () => {
		expect(parseOpen({ timer: true })).toBeUndefined();
	});

	it('из окон на одном месте оставляет последнее открытое', () => {
		expect(parseOpen(['timer', 'radio', 'stats'])).toEqual(['radio', 'stats']);
	});
});

describe('настроение', () => {
	it('читает текущий формат', () => {
		expect(parseMood({ '2026-10-15': { level: 4, note: 'Хороший день' } })).toEqual({
			'2026-10-15': { level: 4, note: 'Хороший день' }
		});
	});

	it('плохие записи отбрасывает, годные оставляет', () => {
		expect(
			parseMood({ '2026-10-15': { level: 3 }, today: { level: 3 }, '2026-10-14': { level: 9 } })
		).toEqual({ '2026-10-15': { level: 3 } });
	});

	it('не объект отбрасывает', () => {
		expect(parseMood('2026-10-15')).toBeUndefined();
		expect(parseMood(null)).toBeUndefined();
	});
});

describe('радио', () => {
	const oldStation = {
		stationuuid: 'u',
		name: 'Record Ambient',
		country: 'Russia',
		countrycode: 'RU',
		url_resolved: 'http://radiorecord.hostingradio.ru/AMBIENT96.aacp',
		codec: 'AAC',
		hls: 0
	};

	it('станция Radio Browser переводится в станцию Рекорда, чужие отбрасываются', () => {
		expect(parseStation(oldStation)?.prefix).toBe('ambient');
		expect(parseStationMap({ u: oldStation })?.['42650']?.title).toBe('Ambient');
		expect(
			parseStation({ ...oldStation, url_resolved: 'https://example.com/a.mp3' })
		).toBeUndefined();
	});

	it('источник станций: старые страна и поиск становятся «все станции», жанры переводятся', () => {
		expect(parseSource({ kind: 'country', code: 'DE' })).toEqual({ kind: 'all' });
		expect(parseSource({ kind: 'search', query: 'jazz' })).toEqual({ kind: 'all' });
		expect(parseSource({ kind: 'genre', genre: 'lofi' })).toEqual({ kind: 'genre', genre: 'lofi' });
		expect(parseSource({ kind: 'genre', genre: 'chillout' })).toEqual({
			kind: 'genre',
			genre: 'chillout'
		});
		expect(parseSource({ kind: 'genre', genre: 'synthwave' })).toEqual({
			kind: 'genre',
			genre: 'synthwave'
		});
		expect(parseSource({ kind: 'genre', genre: 'jazz' })).toEqual({ kind: 'all' });
		expect(parseSource('DE')).toBeUndefined();
	});

	it('порядок станций: «популярные» становятся «по порядку»', () => {
		expect(parseSort('default')).toBe('default');
		expect(parseSort('popular')).toBe('default');
		expect(parseSort(1)).toBeUndefined();
	});
});

describe('затемнение', () => {
	it('читает сохранённое значение и округляет до шага', () => {
		expect(parseDimmer(40)).toBe(40);
		expect(parseDimmer(42)).toBe(40);
	});

	it('мусор и значения вне диапазона отбрасывает', () => {
		expect(parseDimmer('40')).toBeUndefined();
		expect(parseDimmer(95)).toBeUndefined();
		expect(parseDimmer(null)).toBeUndefined();
	});
});

describe('кнопки «Без звука» и «Без эффектов»', () => {
	it('читают сохранённый флаг', () => {
		expect(parseSoundMuted(true)).toBe(true);
		expect(parseSoundMuted(false)).toBe(false);
		expect(parseEffectsOff(true)).toBe(true);
		expect(parseEffectsOff(false)).toBe(false);
	});

	it('мусор отбрасывают', () => {
		expect(parseSoundMuted('true')).toBeUndefined();
		expect(parseSoundMuted(null)).toBeUndefined();
		expect(parseEffectsOff(1)).toBeUndefined();
		expect(parseEffectsOff({})).toBeUndefined();
	});
});

describe('клавиши сайта', () => {
	it('читает флаг, мусор отбрасывает', () => {
		expect(parseSiteHotkeys(true)).toBe(true);
		expect(parseSiteHotkeys(false)).toBe(false);
		expect(parseSiteHotkeys('false')).toBeUndefined();
		expect(parseSiteHotkeys(null)).toBeUndefined();
	});
});

describe('Twitch', () => {
	it('читает последний канал', () => {
		expect(parseSavedChannel('lofigirl')).toBe('lofigirl');
		expect(parseSavedChannel('19barko')).toBe('19barko');
		expect(parseSavedChannel(null)).toBeNull();
	});

	it('плохой канал отбрасывает', () => {
		expect(parseSavedChannel('abc')).toBeUndefined();
		expect(parseSavedChannel('lofi-girl')).toBeUndefined();
		expect(parseSavedChannel('a'.repeat(26))).toBeUndefined();
		expect(parseSavedChannel('')).toBeUndefined();
		expect(parseSavedChannel(5)).toBeUndefined();
		expect(parseSavedChannel({ login: 'lofigirl' })).toBeUndefined();
	});

	it('звук читает только boolean (twitchSound идёт через parseSoundOn)', () => {
		expect(parseSoundOn(true)).toBe(true);
		expect(parseSoundOn(false)).toBe(false);
		expect(parseSoundOn('true')).toBeUndefined();
		expect(parseSoundOn(1)).toBeUndefined();
	});
});

describe('живые обои', () => {
	it('читает только boolean', () => {
		expect(parseLiveWallpaper(true)).toBe(true);
		expect(parseLiveWallpaper(false)).toBe(false);
		expect(parseLiveWallpaper('false')).toBeUndefined();
		expect(parseLiveWallpaper(0)).toBeUndefined();
	});

	it('без выбора решает «уменьшить движение», явный выбор главнее', () => {
		expect(resolveLive(null, false)).toBe(true);
		expect(resolveLive(null, true)).toBe(false);
		expect(resolveLive(true, true)).toBe(true);
		expect(resolveLive(false, false)).toBe(false);
	});
});

describe('эффекты по умолчанию', () => {
	it('с «уменьшить движение» эффектов нет', () => {
		expect(initialState(false).active).toEqual(['embers']);
		expect(initialState(true).active).toEqual([]);
	});
});

describe('настройки проигрывателя', () => {
	it('настройки без поля collectionOpen читаются, окно коллекции открыто', () => {
		const result = parsePlayerSettings({ volume: 30, repeat: 'all', showVideo: true });
		expect(result).toMatchObject({ volume: 30, repeat: 'all', collectionOpen: true });
	});

	it('старый формат с rpm читается, rpm игнорируется', () => {
		const result = parsePlayerSettings({ volume: 30, muted: true, rpm: 45, rate: 1.25 });
		expect(result).toMatchObject({ volume: 30, muted: true, rate: 1.25 });
		expect(result).not.toHaveProperty('rpm');
	});

	it('настройки без поля style читаются, вид — винил; неизвестный вид сбрасывается', () => {
		expect(parsePlayerSettings({ volume: 30 })).toMatchObject({ style: 'vinyl' });
		expect(parsePlayerSettings({ style: 'cd' })).toMatchObject({ style: 'cd' });
		expect(parsePlayerSettings({ style: 'label' })).toMatchObject({ style: 'vinyl' });
	});

	it('старое поле overlays игнорируется, остальные поля остаются', () => {
		const result = parsePlayerSettings({ volume: 30, overlays: ['clock'], repeat: 'all' });
		expect(result).toMatchObject({ volume: 30, repeat: 'all' });
		expect(result).not.toHaveProperty('overlays');
	});
});

describe('коллекция проигрывателя', () => {
	it('старое поле style у пластинки игнорируется, остальное остаётся', () => {
		const result = parsePlayerCollection([
			{ videoId: 'dQw4w9WgXcQ', style: 'label', image: 'frame2', position: 12 }
		]);
		expect(result?.[0]).toEqual({
			id: 'dQw4w9WgXcQ',
			videoId: 'dQw4w9WgXcQ',
			image: 'frame2',
			position: 12
		});
	});

	it('пластинки без поля categoryId читаются как раньше, без категории', () => {
		const result = parsePlayerCollection([{ videoId: 'dQw4w9WgXcQ', image: 'cover' }]);
		expect(result?.[0]).toEqual({ id: 'dQw4w9WgXcQ', videoId: 'dQw4w9WgXcQ', image: 'cover' });
	});

	it('categoryId у пластинки читается', () => {
		const result = parsePlayerCollection([{ videoId: 'dQw4w9WgXcQ', categoryId: 'jazz' }]);
		expect(result?.[0].categoryId).toBe('jazz');
	});
});

describe('категории проигрывателя', () => {
	it('читает сохранённый список, плохие элементы отбрасывает', () => {
		expect(
			parsePlayerCategories([
				{ id: 'j', name: 'Джаз' },
				{ id: 'x' },
				null,
				{ id: 'r', name: 'Рок' }
			])
		).toEqual([
			{ id: 'j', name: 'Джаз' },
			{ id: 'r', name: 'Рок' }
		]);
	});

	it('не список отбрасывает', () => {
		expect(parsePlayerCategories({ id: 'j', name: 'Джаз' })).toBeUndefined();
		expect(parsePlayerCategories(null)).toBeUndefined();
	});
});
