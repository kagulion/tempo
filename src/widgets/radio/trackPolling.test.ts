import { describe, expect, it } from 'vitest';

import {
	shouldPollTracks,
	trackFailureBackoff,
	trackPollDelay,
	trackPollInterval
} from './trackPolling';

describe('shouldPollTracks', () => {
	it('опрашивает, только когда радио играет и вкладка видна', () => {
		expect(shouldPollTracks(true, true)).toBe(true);
		expect(shouldPollTracks(false, true)).toBe(false);
		expect(shouldPollTracks(true, false)).toBe(false);
	});
});

describe('trackPollDelay', () => {
	it('первый запрос сразу', () => {
		expect(trackPollDelay(1000, null, false)).toBe(0);
	});

	it('после успеха ждёт интервал', () => {
		const last = { at: 1000, ok: true };
		expect(trackPollDelay(1000, last, false)).toBe(trackPollInterval);
		expect(trackPollDelay(1000 + 5000, last, false)).toBe(trackPollInterval - 5000);
		expect(trackPollDelay(1000 + trackPollInterval + 1, last, false)).toBe(0);
	});

	it('после успеха по поводу (смена станции, возврат на вкладку) спрашивает сразу', () => {
		expect(trackPollDelay(1500, { at: 1000, ok: true }, true)).toBe(0);
	});

	it('после неудачи молчит две минуты, даже по поводу', () => {
		const last = { at: 1000, ok: false };
		expect(trackPollDelay(1000, last, false)).toBe(trackFailureBackoff);
		expect(trackPollDelay(1000 + 30_000, last, true)).toBe(trackFailureBackoff - 30_000);
		expect(trackPollDelay(1000 + trackFailureBackoff, last, true)).toBe(0);
	});
});
