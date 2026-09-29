import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import argon2 from 'argon2';
import bcrypt from 'bcryptjs';
import type { Cookies } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;
const SESSION_COOKIE =
	process.env.NODE_ENV === 'production' ? '__Host-brassers_session' : 'brassers_session';

function hashToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

function cookieOptions(expires?: Date) {
	return {
		httpOnly: true,
		sameSite: 'lax' as const,
		secure: process.env.NODE_ENV === 'production',
		path: '/',
		...(expires ? { expires } : {})
	};
}

async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
	if (passwordHash.startsWith('$argon2')) {
		return argon2.verify(passwordHash, password);
	}
	if (passwordHash.startsWith('$2')) {
		return bcrypt.compare(password, passwordHash.replace('$2y$', '$2b$'));
	}
	return false;
}

export const authService = {
	async authenticate(username: string, password: string) {
		const user = await prisma.user.findUnique({ where: { username: username.toLowerCase() } });
		if (!user || !(await verifyPassword(password, user.passwordHash))) {
			return null;
		}
		if (!user.passwordHash.startsWith('$argon2')) {
			await prisma.user.update({
				where: { id: user.id },
				data: { passwordHash: await argon2.hash(password, { type: argon2.argon2id }) }
			});
		}
		return { id: user.id, username: user.username, name: user.name, role: user.role };
	},

	async createSession(userId: number, cookies: Cookies): Promise<void> {
		const id = randomUUID();
		const token = randomBytes(32).toString('base64url');
		const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
		await prisma.session.create({
			data: { id, tokenHash: hashToken(token), userId, expiresAt }
		});
		cookies.set(SESSION_COOKIE, `${id}.${token}`, cookieOptions(expiresAt));
	},

	async resolveSession(
		cookies: Cookies
	): Promise<{ user: App.Locals['user']; sessionId: string | null }> {
		const value = cookies.get(SESSION_COOKIE);
		if (!value) return { user: null, sessionId: null };
		const separator = value.indexOf('.');
		if (separator < 1) {
			cookies.delete(SESSION_COOKIE, cookieOptions());
			return { user: null, sessionId: null };
		}
		const id = value.slice(0, separator);
		const token = value.slice(separator + 1);
		const session = await prisma.session.findUnique({ where: { id }, include: { user: true } });
		const suppliedHash = Buffer.from(hashToken(token));
		const storedHash = Buffer.from(session?.tokenHash ?? ''.padEnd(64, '0'));
		const validHash =
			suppliedHash.length === storedHash.length && timingSafeEqual(suppliedHash, storedHash);
		if (!session || !validHash || session.expiresAt <= new Date()) {
			if (session) await prisma.session.delete({ where: { id } }).catch(() => undefined);
			cookies.delete(SESSION_COOKIE, cookieOptions());
			return { user: null, sessionId: null };
		}
		return {
			user: {
				id: session.user.id,
				username: session.user.username,
				name: session.user.name,
				role: session.user.role === 'admin' ? 'admin' : 'user'
			},
			sessionId: session.id
		};
	},

	async destroySession(sessionId: string | null, cookies: Cookies): Promise<void> {
		if (sessionId) await prisma.session.delete({ where: { id: sessionId } }).catch(() => undefined);
		cookies.delete(SESSION_COOKIE, cookieOptions());
	}
};
