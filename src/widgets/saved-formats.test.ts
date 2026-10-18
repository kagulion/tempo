// Разбор того, что посетители сохранили в localStorage раньше. Если тут что-то сломается,
// у старых посетителей молча сбросятся обои, эффекты или открытые окна
import { describe, expect, it } from 'vitest';

import { parsePosition } from './clock/useBigClock';
import { parseDimmer } from './dimmer/dimmer';
import { parseOpen } from './dock/useDock';
import { parseSort, parseSource, parseStation, parseStationMap } from './radio/saved';
import { parseState } from './effects/useActiveEffects';
import { parseMood } from './stats/mood';
import { tvChannels } from './tv/channels';
import { parseSaved } from './wallpaper/useWallpaper';
import { parseSoundOn } from './youtube/playback';
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

	it('читает телеканал из списка по id вида tv/<id канала>', () => {
		const id = `tv/${tvChannels[0].id}`;
		expect(parseSaved({ id })).toEqual({ id });
	});

	it('канал, которого нет в списке, отбрасывает', () => {
		expect(parseSaved({ id: 'tv/Removed.channel' })).toBeUndefined();
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

describe('звук видео-обоев (YouTube и ТВ)', () => {
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
