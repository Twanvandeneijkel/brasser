import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { setFlash } from '$lib/server/flash';
import { synchronizeExcel } from '$lib/server/services/excel-service';
import { stockService, type StockStatus } from '$lib/server/services/stock-service';
import {
	formObject,
	parseWeights,
	productSchema,
	stockCountSchema,
	stockSettingsSchema
} from '$lib/server/validation';

function requireAdmin(user: App.Locals['user']): asserts user is NonNullable<App.Locals['user']> {
	if (!user || user.role !== 'admin')
		error(403, 'Alleen de beheerder mag deze wijziging uitvoeren.');
}

async function finish(cookies: Parameters<typeof setFlash>[0], message: string): Promise<void> {
	try {
		await synchronizeExcel();
		setFlash(cookies, { type: 'success', message });
	} catch (reason) {
		console.error('Excel-synchronisatie mislukt', reason);
		setFlash(cookies, {
			type: 'warning',
			message: `${message} Excel kon niet worden vernieuwd; sluit het bestand en probeer opnieuw.`
		});
	}
}

export const load: PageServerLoad = async ({ url }) => {
	const query = (url.searchParams.get('q') ?? '').slice(0, 100);
	const requestedStatus = url.searchParams.get('status') ?? 'all';
	const status: StockStatus | 'all' = ['all', 'empty', 'low', 'production', 'full'].includes(
		requestedStatus
	)
		? (requestedStatus as StockStatus | 'all')
		: 'all';
	const [items, summary, movements] = await Promise.all([
		stockService.list(query, status),
		stockService.summary(),
		stockService.recentMovements()
	]);
	return { items, summary, movements, filters: { query, status } };
};

export const actions: Actions = {
	createProduct: async ({ request, locals, cookies }) => {
		requireAdmin(locals.user);
		const parsed = productSchema.safeParse(formObject(await request.formData()));
		if (!parsed.success)
			return fail(400, { createError: 'Vul een geldige productnaam en gewichten in.' });
		const weights = parseWeights(parsed.data.weights);
		if (!weights) return fail(400, { createError: 'Gebruik gewichten zoals 500g, 1kg en 2.5kg.' });
		try {
			await stockService.createProduct(parsed.data.name, weights);
		} catch (reason) {
			if (reason instanceof Error && reason.message === 'PRODUCT_EXISTS')
				return fail(409, { createError: 'Dit product bestaat al.' });
			throw reason;
		}
		await finish(cookies, 'Product en gewichtvarianten toegevoegd.');
		redirect(303, '/stock');
	},
	recordCount: async ({ request, locals, cookies }) => {
		requireAdmin(locals.user);
		const parsed = stockCountSchema.safeParse(formObject(await request.formData()));
		if (!parsed.success) return fail(400, { actionError: 'De voorraadtelling is ongeldig.' });
		try {
			await stockService.recordCount(
				parsed.data.id,
				parsed.data.countedStock,
				locals.user,
				parsed.data.note
			);
		} catch (reason) {
			if (
				reason instanceof Error &&
				['STOCK_NOT_FOUND', 'INVALID_STOCK'].includes(reason.message)
			) {
				return fail(400, { actionError: 'De telling valt buiten de toegestane voorraadgrenzen.' });
			}
			throw reason;
		}
		await finish(cookies, 'De voorraadtelling is opgeslagen.');
		redirect(303, '/stock');
	},
	updateSettings: async ({ request, locals, cookies }) => {
		requireAdmin(locals.user);
		const parsed = stockSettingsSchema.safeParse(formObject(await request.formData()));
		if (!parsed.success) return fail(400, { actionError: 'De standaardwaarden zijn ongeldig.' });
		try {
			await stockService.updateSettings(
				parsed.data.id,
				parsed.data.shelfCapacity,
				parsed.data.unitsPerBatch
			);
		} catch (reason) {
			if (
				reason instanceof Error &&
				['STOCK_NOT_FOUND', 'INVALID_SETTINGS'].includes(reason.message)
			) {
				return fail(400, {
					actionError: 'De capaciteit mag niet lager zijn dan de actuele voorraad.'
				});
			}
			throw reason;
		}
		await finish(cookies, 'De standaardwaarden zijn opgeslagen.');
		redirect(303, '/stock');
	}
};
