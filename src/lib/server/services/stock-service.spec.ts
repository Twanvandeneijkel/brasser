import { describe, expect, it } from 'vitest';
import { calculateAdvice, stockStatus } from './stock-service';

describe('calculateAdvice', () => {
	it('rondt omhoog naar volledige productierondes', () => {
		expect(calculateAdvice(3, 10, 4)).toEqual({
			neededUnits: 7,
			batches: 2,
			productionUnits: 8,
			overflow: 1
		});
	});

	it('adviseert niets voor een vol vak', () => {
		expect(calculateAdvice(10, 10, 4).batches).toBe(0);
	});
});

describe('stockStatus', () => {
	it('onderscheidt leeg, laag, aanvullen en vol', () => {
		expect(stockStatus(0, 10)).toBe('empty');
		expect(stockStatus(2, 10)).toBe('low');
		expect(stockStatus(8, 10)).toBe('production');
		expect(stockStatus(10, 10)).toBe('full');
	});
});
