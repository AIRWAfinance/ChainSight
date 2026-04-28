import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateUser } from '@/lib/auth/users';
import { signSession, setSessionCookie } from '@/lib/auth/session';
import { checkRateLimit, clientKey } from '@/lib/auth/rate-limit';

export const runtime = 'nodejs';

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return 'unknown';
}

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: 'invalid_request', message: 'Email and password required' },
      { status: 400 },
    );
  }

  const ip = clientIp(req);
  const key = clientKey(ip, parsed.email);
  const limit = checkRateLimit(key, { windowSeconds: 15 * 60, maxAttempts: 5 });
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: 'rate_limited',
        message: `Too many login attempts. Try again in ${limit.retryAfterSeconds} seconds.`,
      },
      {
        status: 429,
        headers: { 'Retry-After': String(limit.retryAfterSeconds) },
      },
    );
  }

  const user = await authenticateUser(parsed.email, parsed.password);
  if (!user) {
    return NextResponse.json(
      { error: 'invalid_credentials', message: 'Invalid email or password' },
      {
        status: 401,
        headers: { 'X-RateLimit-Remaining': String(limit.remaining) },
      },
    );
  }
  const token = await signSession(user.id, user.email);
  await setSessionCookie(token);
  return NextResponse.json(
    { user: { id: user.id, email: user.email } },
    { status: 200 },
  );
}
