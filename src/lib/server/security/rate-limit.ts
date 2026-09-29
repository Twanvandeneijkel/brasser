type Attempt = { count: number; windowStartedAt: number; blockedUntil: number };

const attempts = new Map<string, Attempt>();
const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export function assertLoginAllowed(key: string): void {
	const now = Date.now();
	const attempt = attempts.get(key);
	if (!attempt) return;
	if (attempt.blockedUntil > now) {
		throw new Error('RATE_LIMITED');
	}
	if (now - attempt.windowStartedAt > WINDOW_MS) {
		attempts.delete(key);
	}
}

export function registerLoginFailure(key: string): void {
	const now = Date.now();
	const previous = attempts.get(key);
	const attempt =
		!previous || now - previous.windowStartedAt > WINDOW_MS
			? { count: 0, windowStartedAt: now, blockedUntil: 0 }
			: previous;
	attempt.count += 1;
	if (attempt.count >= MAX_ATTEMPTS) {
		attempt.blockedUntil = now + BLOCK_MS;
	}
	attempts.set(key, attempt);
}

export function clearLoginFailures(key: string): void {
	attempts.delete(key);
}
