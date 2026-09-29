import type { LayoutServerLoad } from './$types';
import { consumeFlash } from '$lib/server/flash';

export const load: LayoutServerLoad = ({ locals, cookies }) => ({
	user: locals.user,
	flash: consumeFlash(cookies)
});
