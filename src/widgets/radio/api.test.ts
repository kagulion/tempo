import { afterEach, describe, expect, it, vi } from 'vitest';

import { countStationClick, voteStation } from './api';

// Настоящий API не трогаем: голос нельзя отозвать, а повторить можно только через 10 минут
function mockFetch(...responses: (object | Error)[]) {
	const fetchMock = vi.fn();
	for (const response of responses) {
		if (response instanceof Error) fetchMock.mockRejectedValueOnce(response);
		else fetchMock.mockResolvedValueOnce({ ok: true, json: async () => response });
	}
	vi.stubGlobal('fetch', fetchMock);
	return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe('voteStation', () => {
	it('успех: ходит на /json/vote/<uuid>', async () => {
		const fetchMock = mockFetch({ ok: true, message: 'voted for station successfully' });
		const result = await voteStation('abc');
		expect(result.ok).toBe(true);
		expect(fetchMock.mock.calls[0][0]).toMatch(/\/json\/vote\/abc$/);
	});

	it('отказ сервера окончателен: на другие зеркала не идём, причина по-русски', async () => {
		const fetchMock = mockFetch({
			ok: false,
			message: "VoteError 'you are voting for the same station too fast'"
		});
		const result = await voteStation('abc');
		expect(result.ok).toBe(false);
		expect(result.message).toContain('10 минут');
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('сеть упала на одном зеркале — пробует следующее', async () => {
		const fetchMock = mockFetch(new Error('CORS'), { ok: true, message: 'ok' });
		expect((await voteStation('abc')).ok).toBe(true);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('все зеркала недоступны — ok=false с причиной', async () => {
		mockFetch(new Error('a'), new Error('b'), new Error('c'));
		const result = await voteStation('abc');
		expect(result.ok).toBe(false);
		expect(result.message).not.toBe('');
	});
});

describe('countStationClick', () => {
	it('ходит на /json/url/<uuid> и не падает при ошибке сети', async () => {
		const fetchMock = mockFetch(new Error('a'), new Error('b'), new Error('c'));
		await expect(countStationClick('abc')).resolves.toBeUndefined();
		expect(fetchMock.mock.calls[0][0]).toMatch(/\/json\/url\/abc$/);
	});
});
