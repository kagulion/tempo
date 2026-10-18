import { describe, expect, it } from 'vitest';

import { type LaunchEvent, type LaunchState, initialLaunch, reduceLaunch } from './launch';

const run = (events: LaunchEvent[], from: LaunchState = initialLaunch) =>
	events.reduce(reduceLaunch, from);

describe('reduceLaunch', () => {
	it('выбранный только что эфир, плеер молчит — запуск поверх окон', () => {
		expect(run([{ type: 'silent', fresh: true }])).toEqual({ phase: 'launch', started: false });
	});

	it('эфир восстановился после перезагрузки — ждёт запуска, поверх окон не лезет', () => {
		expect(run([{ type: 'silent', fresh: false }])).toEqual({ phase: 'waiting', started: false });
	});

	it('Play в окне открывает запуск и из фона, и из ожидания', () => {
		expect(run([{ type: 'userStart' }]).phase).toBe('launch');
		expect(run([{ type: 'silent', fresh: false }, { type: 'userStart' }]).phase).toBe('launch');
	});

	it('старт возвращает плеер на фон', () => {
		expect(run([{ type: 'silent', fresh: true }, { type: 'started' }])).toEqual({
			phase: 'background',
			started: true
		});
		expect(run([{ type: 'started' }]).phase).toBe('background');
	});

	it('после старта в запуск и ожидание не возвращаемся', () => {
		const started = run([{ type: 'started' }]);
		expect(run([{ type: 'silent', fresh: true }], started)).toBe(started);
		expect(run([{ type: 'userStart' }], started)).toBe(started);
	});

	it('повторное молчание во время запуска ничего не меняет', () => {
		const launch = run([{ type: 'userStart' }]);
		expect(run([{ type: 'silent', fresh: false }], launch)).toBe(launch);
		expect(run([{ type: 'userStart' }], launch)).toBe(launch);
	});
});
