import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateUser } from '@/lib/auth/users';
import { signSession, setSessionCookie } from '@/lib/auth/session';
import { checkRateLimit, clientKey } from '@/lib/auth/rate-limit';
import { ensureAdminFromAllowlist } from '@/lib/auth/admin';
import {
  clientIpFrom,
  logLoginFail,
  logLoginRateLimited,
  logLoginSuccess,
} from '@/lib/audit/log';

export const runtime = 'nodejs';

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

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

  const ip = clientIpFrom(req);
  const key = clientKey(ip, parsed.email);
  const limit = checkRateLimit(key, { windowSeconds: 15 * 60, maxAttempts: 5 });
  if (!limit.allowed) {
    await logLoginRateLimited({
      actorIp: ip,
      email: parsed.email,
      retryAfterSeconds: limit.retryAfterSeconds,
    });
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
    await logLoginFail({
      actorIp: ip,
      email: parsed.email,
      reason: 'invalid_credentials',
    });
    return NextResponse.json(
      { error: 'invalid_credentials', message: 'Invalid email or password' },
      {
        status: 401,
        headers: { 'X-RateLimit-Remaining': String(limit.remaining) },
      },
    );
  }

  // Auto-promote to admin if email is on the env allowlist.
  const role = await ensureAdminFromAllowlist(user.id, user.email, user.role);

  // If the user has TOTP enrolled, issue an MFA-pending cookie and instruct
  // the client to call /api/auth/mfa/login with the TOTP code.
  if (user.totpEnabled) {
    const pendingToken = await signSession(user.id, user.email, {
      mfa: false,
      role,
    });
    await setSessionCookie(pendingToken);
    return NextResponse.json(
      {
        needs_mfa: true,
        user: { id: user.id, email: user.email },
      },
      { status: 200 },
    );
  }

  const token = await signSession(user.id, user.email, { mfa: true, role });
  await setSessionCookie(token);
  await logLoginSuccess({
    actorIp: ip,
    userId: user.id,
    email: user.email,
  });
  return NextResponse.json(
    { user: { id: user.id, email: user.email, role } },
    { status: 200 },
  );
}
