import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { authService } from '$lib/server/services/auth-service';
import {
	assertLoginAllowed,
	clearLoginFailures,
	registerLoginFailure
} from '$lib/server/security/rate-limit';
import { formObject, loginSchema } from '$lib/server/validation';
import { setFlash } from '$lib/server/flash';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) redirect(303, '/');
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies, getClientAddress, url }) => {
		const parsed = loginSchema.safeParse(formObject(await request.formData()));
		if (!parsed.success) return fail(400, { error: 'Vul je gebruikersnaam en wachtwoord in.' });
		const key = `${getClientAddress()}:${parsed.data.username.toLocaleLowerCase('nl-NL')}`;
		try {
			assertLoginAllowed(key);
		} catch {
			return fail(429, {
				error: 'Te veel mislukte pogingen. Probeer het over 15 minuten opnieuw.'
			});
		}
		const user = await authService.authenticate(parsed.data.username, parsed.data.password);
		if (!user) {
			registerLoginFailure(key);
			return fail(400, { error: 'De gebruikersnaam of het wachtwoord is onjuist.' });
		}
		clearLoginFailures(key);
		await authService.createSession(user.id, cookies);
		setFlash(cookies, { type: 'success', message: `Welkom, ${user.name ?? user.username}.` });
		const next = url.searchParams.get('next');
		redirect(303, next?.startsWith('/') && !next.startsWith('//') ? next : '/');
	}
};
