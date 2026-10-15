// Разбор того, что посетители сохранили в localStorage раньше. Если тут что-то сломается,
// у старых посетителей молча сбросятся обои, эффекты или открытые окна
import { describe, expect, it } from 'vitest';

import { parseOpen } from './dock/useDock';
import {
	normalizeStation,
	parseLiked,
	parseSort,
	parseSource,
	parseStationMap
} from './radio/stations';
import { parseState } from './effects/useActiveEffects';
import { parseMood } from './stats/mood';
import { parseSoundOn } from './wallpaper/playback';
import { parseSaved } from './wallpaper/useWallpaper';
import { parseHistory } from './wallpaper/youtube';

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

describe('звук видео-обоев', () => {
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

describe('открытые окна', () => {
	it('убирает удалённые виджеты и сохраняет порядок открытия', () => {
		expect(parseOpen(['timer', 'removed', 'radio'])).toEqual(['timer', 'radio']);
	});

	it('мусор отбрасывает', () => {
		expect(parseOpen({ timer: true })).toBeUndefined();
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
	it('станция из старого сохранения получает votes, clickcount и tags', () => {
		const saved = {
			stationuuid: 'u',
			name: 'Old',
			country: 'Germany',
			countrycode: 'DE',
			url_resolved: 'https://example.com/a.mp3',
			codec: 'MP3',
			hls: 0
		};
		expect(normalizeStation(saved)).toEqual({ ...saved, votes: 0, clickcount: 0, tags: '' });
		expect(parseStationMap({ u: saved })?.u.votes).toBe(0);
	});

	it('источник станций: читает страну, жанр и поиск, мусор отбрасывает', () => {
		expect(parseSource({ kind: 'country', code: 'DE' })).toEqual({ kind: 'country', code: 'DE' });
		expect(parseSource({ kind: 'genre', genre: 'lofi' })).toEqual({ kind: 'genre', genre: 'lofi' });
		expect(parseSource({ kind: 'genre', genre: 'removed' })).toBeUndefined();
		expect(parseSource('DE')).toBeUndefined();
	});

	it('порядок станций и лайки', () => {
		expect(parseSort('popular')).toBe('popular');
		expect(parseSort(1)).toBeUndefined();
		expect(parseLiked({ u: 1 })).toEqual({ u: 1 });
		expect(parseLiked(['u'])).toBeUndefined();
	});
});
