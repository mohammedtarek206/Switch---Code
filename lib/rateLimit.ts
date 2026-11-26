import { NextRequest } from 'next/server';

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Periodically clean up expired entries to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    rateLimitStore.forEach((entry, key) => {
        if (entry.resetAt <= now) {
            rateLimitStore.delete(key);
        }
    });
}, 60_000).unref?.();

export function getClientIp(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return req.headers.get('x-real-ip') || 'unknown';
}

export function checkRateLimit(
    key: string,
    limit = 10,
    windowMs = 15 * 60 * 1000
): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const existing = rateLimitStore.get(key);

    if (!existing || existing.resetAt <= now) {
        const entry: RateLimitEntry = { count: 1, resetAt: now + windowMs };
        rateLimitStore.set(key, entry);
        return { allowed: true, remaining: limit - 1, resetAt: entry.resetAt };
    }

    if (existing.count >= limit) {
        return { allowed: false, remaining: 0, resetAt: existing.resetAt };
    }

    existing.count += 1;
    return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}
