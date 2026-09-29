import { z } from 'zod';

const finiteNonNegative = z.coerce.number().finite().min(0);
const nutrientShape = {
	fat: finiteNonNegative.max(1000),
	saturates: finiteNonNegative.max(1000),
	carbohydrates: finiteNonNegative.max(1000),
	sugars: finiteNonNegative.max(1000),
	protein: finiteNonNegative.max(1000),
	salt: finiteNonNegative.max(1000)
};

function refineNutrients<T extends z.ZodObject<typeof nutrientShape>>(schema: T) {
	return schema
		.refine((data) => data.saturates <= data.fat, {
			message: 'Verzadigd vet kan niet hoger zijn dan het totale vet.',
			path: ['saturates']
		})
		.refine((data) => data.sugars <= data.carbohydrates, {
			message: 'Suikers kunnen niet hoger zijn dan de totale koolhydraten.',
			path: ['sugars']
		});
}

export const loginSchema = z.object({
	username: z.string().trim().min(1).max(100),
	password: z.string().min(1).max(256)
});

export const productSchema = z.object({
	name: z.string().trim().min(1).max(100),
	weights: z.string().trim().min(1).max(500)
});

export const stockCountSchema = z.object({
	id: z.coerce.number().int().positive(),
	countedStock: z.coerce.number().int().min(0),
	note: z.string().trim().max(160)
});

export const stockSettingsSchema = z.object({
	id: z.coerce.number().int().positive(),
	shelfCapacity: z.coerce.number().int().min(1),
	unitsPerBatch: z.coerce.number().int().min(1)
});

export const nutritionSchema = refineNutrients(
	z.object({
		productName: z.string().trim().min(1).max(100),
		portionGrams: z.coerce.number().finite().positive().max(1_000_000),
		...nutrientShape
	})
);

export const ingredientSchema = refineNutrients(
	z.object({
		id: z.coerce.number().int().positive().optional(),
		name: z.string().trim().min(1).max(100),
		...nutrientShape
	})
);

export const recipeItemSchema = z.object({
	productVariantId: z.coerce.number().int().positive(),
	ingredientId: z.coerce.number().int().positive(),
	amountGrams: z.coerce.number().finite().positive().max(1_000_000)
});

export function parseWeights(input: string): number[] | null {
	const normalized = input.trim().toLocaleLowerCase('nl-NL');
	if (!normalized) return null;
	const weights: number[] = [];
	const token = /(\d+(?:[.,]\d+)?)\s*(kg|g)?/g;
	let cursor = 0;
	for (const match of normalized.matchAll(token)) {
		if (!/^\s*[,;]?\s*$/.test(normalized.slice(cursor, match.index))) return null;
		const numeric = Number(match[1].replace(',', '.'));
		const grams = (match[2] ?? 'g') === 'kg' ? numeric * 1000 : numeric;
		if (!Number.isSafeInteger(grams) || grams <= 0) return null;
		weights.push(grams);
		cursor = match.index + match[0].length;
	}
	if (!/^\s*$/.test(normalized.slice(cursor)) || weights.length === 0) return null;
	return [...new Set(weights)].sort((a, b) => a - b);
}

export function formObject(formData: FormData): Record<string, FormDataEntryValue> {
	return Object.fromEntries(formData.entries());
}
