interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export interface RateLimitOptions {
  windowSeconds: number;
  maxAttempts: number;
}

const DEFAULTS: RateLimitOptions = {
  windowSeconds: 15 * 60,
  maxAttempts: 5,
};

export function checkRateLimit(
  key: string,
  opts: Partial<RateLimitOptions> = {},
): RateLimitResult {
  const { windowSeconds, maxAttempts } = { ...DEFAULTS, ...opts };
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, remaining: maxAttempts - 1, retryAfterSeconds: 0 };
  }

  if (bucket.count >= maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return {
    allowed: true,
    remaining: maxAttempts - bucket.count,
    retryAfterSeconds: 0,
  };
}

export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

export function clearAllRateLimits(): void {
  buckets.clear();
}

export function clientKey(ip: string | null | undefined, identifier: string): string {
  const safeIp = (ip ?? 'unknown').trim().toLowerCase();
  const safeId = identifier.trim().toLowerCase();
  return `${safeIp}::${safeId}`;
}
