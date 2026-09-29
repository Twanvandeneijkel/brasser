import type { Cookies } from '@sveltejs/kit';

export type Flash = { type: 'success' | 'error' | 'warning'; message: string };
const FLASH_COOKIE = 'brassers_flash';

export function setFlash(cookies: Cookies, flash: Flash): void {
	cookies.set(FLASH_COOKIE, Buffer.from(JSON.stringify(flash)).toString('base64url'), {
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		path: '/',
		maxAge: 60
	});
}

export function consumeFlash(cookies: Cookies): Flash | null {
	const value = cookies.get(FLASH_COOKIE);
	cookies.delete(FLASH_COOKIE, { path: '/' });
	if (!value) return null;
	try {
		const flash = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as Flash;
		if (
			!['success', 'error', 'warning'].includes(flash.type) ||
			typeof flash.message !== 'string'
		) {
			return null;
		}
		return flash;
	} catch {
		return null;
	}
}
