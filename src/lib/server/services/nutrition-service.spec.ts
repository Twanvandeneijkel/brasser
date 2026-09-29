import { describe, expect, it } from 'vitest';
import { calculateNutrition, formatWeight } from './nutrition-service';

describe('calculateNutrition', () => {
	it('berekent energie en portiewaarden met de standaardformule', () => {
		const result = calculateNutrition({
			productName: 'Testbrood',
			portionGrams: 50,
			fat: 2,
			saturates: 0.5,
			carbohydrates: 40,
			sugars: 3,
			protein: 10,
			salt: 1
		});

		expect(result.energyKcal).toBe(218);
		expect(result.energyKj).toBe(912.1);
		expect(result.portionEnergyKcal).toBe(109);
		expect(result.label).toContain('VOEDINGSWAARDE – Testbrood');
	});
});

describe('formatWeight', () => {
	it('gebruikt gram en kilogram op een leesbare manier', () => {
		expect(formatWeight(500)).toBe('500 g');
		expect(formatWeight(2500)).toBe('2,5 kg');
	});
});
