import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { authService } from '$lib/server/services/auth-service';

export const POST: RequestHandler = async ({ locals, cookies }) => {
	await authService.destroySession(locals.sessionId, cookies);
	redirect(303, '/login');
};
