// Разбор того, что посетители сохранили в localStorage раньше. Если тут что-то сломается,
// у старых посетителей молча сбросятся обои, эффекты или открытые окна
import { describe, expect, it } from 'vitest';

import { parseOpen } from './dock/useDock';
import { parseState } from './effects/useActiveEffects';
import { parseSaved } from './wallpaper/useWallpaper';

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

	it('неизвестные обои и мусор отбрасывает', () => {
		expect(parseSaved({ id: 'removed/wallpaper' })).toBeUndefined();
		expect(parseSaved({ faction: 'scourge' })).toBeUndefined();
		expect(parseSaved('horde')).toBeUndefined();
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
