import { randomUUID } from 'node:crypto';
import { redirect, type Handle, type HandleServerError } from '@sveltejs/kit';
import { authService } from '$lib/server/services/auth-service';

const protectedPrefixes = ['/stock', '/recipes', '/nutritional-values', '/api/excel'];

export const handle: Handle = async ({ event, resolve }) => {
	const session = await authService.resolveSession(event.cookies);
	event.locals.user = session.user;
	event.locals.sessionId = session.sessionId;

	if (protectedPrefixes.some((prefix) => event.url.pathname.startsWith(prefix)) && !session.user) {
		redirect(303, `/login?next=${encodeURIComponent(event.url.pathname)}`);
	}

	const response = await resolve(event);
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	if (session.user) response.headers.set('Cache-Control', 'private, no-store');
	return response;
};

export const handleError: HandleServerError = ({ error, event }) => {
	const requestId = randomUUID();
	console.error(`[${requestId}] ${event.request.method} ${event.url.pathname}`, error);
	return { message: 'Er ging iets mis. Probeer het later opnieuw.', requestId };
};
