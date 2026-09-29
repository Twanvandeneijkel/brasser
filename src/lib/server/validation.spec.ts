import { describe, expect, it } from 'vitest';
import { ingredientSchema, parseWeights } from './validation';

describe('parseWeights', () => {
	it('accepteert gram, kilogram, komma en punt', () => {
		expect(parseWeights('500g, 1kg; 2,5 kg')).toEqual([500, 1000, 2500]);
	});

	it('verwijdert dubbele waarden en weigert ongeldige invoer', () => {
		expect(parseWeights('1kg, 1000g')).toEqual([1000]);
		expect(parseWeights('een kilo')).toBeNull();
	});
});

describe('ingredientSchema', () => {
	it('weigert suikers boven koolhydraten', () => {
		const result = ingredientSchema.safeParse({
			name: 'Test',
			fat: 1,
			saturates: 0,
			carbohydrates: 2,
			sugars: 3,
			protein: 4,
			salt: 0
		});
		expect(result.success).toBe(false);
	});
});
