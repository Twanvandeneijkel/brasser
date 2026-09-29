import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { calculateNutrition } from '$lib/server/services/nutrition-service';
import { formObject, nutritionSchema } from '$lib/server/validation';

export const actions: Actions = {
	default: async ({ request }) => {
		const values = formObject(await request.formData());
		const parsed = nutritionSchema.safeParse(values);
		if (!parsed.success) {
			return fail(400, { values, errors: parsed.error.flatten().fieldErrors });
		}
		return { values, result: calculateNutrition(parsed.data) };
	}
};
