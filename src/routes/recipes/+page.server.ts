import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { setFlash } from '$lib/server/flash';
import { synchronizeExcel } from '$lib/server/services/excel-service';
import { recipeService } from '$lib/server/services/recipe-service';
import { formObject, ingredientSchema, recipeItemSchema } from '$lib/server/validation';

function requireAdmin(user: App.Locals['user']): void {
	if (!user || user.role !== 'admin')
		error(403, 'Alleen de beheerder mag deze wijziging uitvoeren.');
}

async function finish(cookies: Parameters<typeof setFlash>[0], message: string): Promise<void> {
	try {
		await synchronizeExcel();
		setFlash(cookies, { type: 'success', message });
	} catch (reason) {
		console.error('Excel-synchronisatie mislukt', reason);
		setFlash(cookies, { type: 'warning', message: `${message} Excel kon niet worden vernieuwd.` });
	}
}

export const load: PageServerLoad = async () => recipeService.pageData();

export const actions: Actions = {
	createIngredient: async ({ request, locals, cookies }) => {
		requireAdmin(locals.user);
		const parsed = ingredientSchema.safeParse(formObject(await request.formData()));
		if (!parsed.success)
			return fail(400, {
				ingredientError: parsed.error.issues[0]?.message ?? 'Ongeldige grondstof.'
			});
		const ingredient = {
			name: parsed.data.name,
			fat: parsed.data.fat,
			saturates: parsed.data.saturates,
			carbohydrates: parsed.data.carbohydrates,
			sugars: parsed.data.sugars,
			protein: parsed.data.protein,
			salt: parsed.data.salt
		};
		try {
			await recipeService.createIngredient(ingredient);
		} catch (reason) {
			if (reason instanceof Error && reason.message === 'INGREDIENT_EXISTS')
				return fail(409, { ingredientError: 'Deze grondstof bestaat al.' });
			throw reason;
		}
		await finish(cookies, 'Grondstof en voedingswaarden opgeslagen.');
		redirect(303, '/recipes');
	},
	updateIngredient: async ({ request, locals, cookies }) => {
		requireAdmin(locals.user);
		const parsed = ingredientSchema.safeParse(formObject(await request.formData()));
		if (!parsed.success || !parsed.data.id)
			return fail(400, { ingredientError: 'De gewijzigde grondstof is ongeldig.' });
		const { id, ...ingredient } = parsed.data;
		try {
			await recipeService.updateIngredient(id, ingredient);
		} catch (reason) {
			if (reason instanceof Error && reason.message === 'INGREDIENT_EXISTS')
				return fail(409, { ingredientError: 'Deze naam is al in gebruik.' });
			throw reason;
		}
		await finish(cookies, 'Grondstof bijgewerkt; receptberekeningen zijn vernieuwd.');
		redirect(303, '/recipes');
	},
	upsertRecipeItem: async ({ request, locals, cookies }) => {
		requireAdmin(locals.user);
		const parsed = recipeItemSchema.safeParse(formObject(await request.formData()));
		if (!parsed.success)
			return fail(400, { recipeError: 'Selecteer een product, grondstof en geldige hoeveelheid.' });
		await recipeService.upsertRecipeIngredient(
			parsed.data.productVariantId,
			parsed.data.ingredientId,
			parsed.data.amountGrams
		);
		await finish(cookies, 'De receptregel is opgeslagen.');
		redirect(303, '/recipes');
	},
	deleteRecipeItem: async ({ request, locals, cookies }) => {
		requireAdmin(locals.user);
		const id = Number((await request.formData()).get('id'));
		if (!Number.isSafeInteger(id) || id < 1)
			return fail(400, { recipeError: 'Ongeldige receptregel.' });
		await recipeService.deleteRecipeIngredient(id);
		await finish(cookies, 'De grondstof is uit het recept verwijderd.');
		redirect(303, '/recipes');
	}
};
