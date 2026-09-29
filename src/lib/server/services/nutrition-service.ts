export type NutritionInput = {
	productName: string;
	portionGrams: number;
	fat: number;
	saturates: number;
	carbohydrates: number;
	sugars: number;
	protein: number;
	salt: number;
};

export type NutritionResult = NutritionInput & {
	energyKcal: number;
	energyKj: number;
	portionEnergyKcal: number;
	portionEnergyKj: number;
	portionFat: number;
	portionSaturates: number;
	portionCarbohydrates: number;
	portionSugars: number;
	portionProtein: number;
	portionSalt: number;
	label: string;
};

const round = (value: number, decimals = 1) => {
	const factor = 10 ** decimals;
	return Math.round((value + Number.EPSILON) * factor) / factor;
};

export function calculateNutrition(input: NutritionInput): NutritionResult {
	const energyKcal = round(input.fat * 9 + input.carbohydrates * 4 + input.protein * 4);
	const energyKj = round(energyKcal * 4.184);
	const factor = input.portionGrams / 100;
	const result: NutritionResult = {
		...input,
		label: '',
		energyKcal,
		energyKj,
		portionEnergyKcal: round(energyKcal * factor),
		portionEnergyKj: round(energyKj * factor),
		portionFat: round(input.fat * factor),
		portionSaturates: round(input.saturates * factor),
		portionCarbohydrates: round(input.carbohydrates * factor),
		portionSugars: round(input.sugars * factor),
		portionProtein: round(input.protein * factor),
		portionSalt: round(input.salt * factor)
	};
	result.label = [
		`VOEDINGSWAARDE – ${input.productName}`,
		`Per 100 g | Per portie (${input.portionGrams} g)`,
		`Energie: ${energyKj} kJ / ${energyKcal} kcal | ${result.portionEnergyKj} kJ / ${result.portionEnergyKcal} kcal`,
		`Vetten: ${input.fat} g | ${result.portionFat} g`,
		`waarvan verzadigde vetzuren: ${input.saturates} g | ${result.portionSaturates} g`,
		`Koolhydraten: ${input.carbohydrates} g | ${result.portionCarbohydrates} g`,
		`waarvan suikers: ${input.sugars} g | ${result.portionSugars} g`,
		`Eiwitten: ${input.protein} g | ${result.portionProtein} g`,
		`Zout: ${input.salt} g | ${result.portionSalt} g`
	].join('\n');
	return result;
}

export function formatWeight(grams: number): string {
	if (grams < 1000) return `${grams} g`;
	return `${new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 2 }).format(grams / 1000)} kg`;
}
