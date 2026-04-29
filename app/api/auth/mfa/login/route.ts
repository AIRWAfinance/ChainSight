import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getStorageBackend } from '@/lib/storage';
import { getSession, signSession, setSessionCookie } from '@/lib/auth/session';
import { verifyTotp } from '@/lib/auth/totp';
import { checkRateLimit, clientKey } from '@/lib/auth/rate-limit';
import {
  clientIpFrom,
  logLoginFail,
  logLoginSuccess,
  recordAuditEvent,
} from '@/lib/audit/log';

export const runtime = 'nodejs';

const Body = z.object({ code: z.string().min(6).max(8) });

/**
 * POST /api/auth/mfa/login
 *
 * Complete an MFA-pending login by submitting the TOTP code.
 *
 * Requires the short-lived MFA-pending cookie issued by /api/auth/login when
 * the user has TOTP enrolled. Same rate-limit policy as the password step.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.mfa) {
    return NextResponse.json(
      { error: 'no_pending_mfa', message: 'No MFA challenge in progress' },
      { status: 400 },
    );
  }

  let body;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: 'invalid_request', message: 'code required' },
      { status: 400 },
    );
  }

  const ip = clientIpFrom(req);
  const key = clientKey(ip, `mfa:${session.email}`);
  const limit = checkRateLimit(key, { windowSeconds: 15 * 60, maxAttempts: 5 });
  if (!limit.allowed) {
    await recordAuditEvent({
      actorUserId: session.userId,
      actorIp: ip,
      action: 'auth.login.rate_limited',
      targetType: 'user',
      targetId: session.userId,
      payload: { stage: 'mfa', retryAfterSeconds: limit.retryAfterSeconds },
    });
    return NextResponse.json(
      {
        error: 'rate_limited',
        message: `Too many MFA attempts. Try again in ${limit.retryAfterSeconds} seconds.`,
      },
      {
        status: 429,
        headers: { 'Retry-After': String(limit.retryAfterSeconds) },
      },
    );
  }

  const totp = await getStorageBackend().getUserTotpState(session.userId);
  if (!totp?.secret || !totp.verifiedAt) {
    return NextResponse.json(
      { error: 'no_mfa_enrolled', message: 'MFA not enrolled' },
      { status: 400 },
    );
  }

  const ok = verifyTotp(totp.secret, body.code);
  if (!ok) {
    await logLoginFail({ actorIp: ip, email: session.email, reason: 'mfa_fail' });
    return NextResponse.json(
      { error: 'invalid_code', message: 'Invalid TOTP code' },
      { status: 401 },
    );
  }

  const token = await signSession(session.userId, session.email, { mfa: true });
  await setSessionCookie(token);

  await logLoginSuccess({
    actorIp: ip,
    userId: session.userId,
    email: session.email,
  });

  return NextResponse.json(
    { user: { id: session.userId, email: session.email } },
    { status: 200 },
  );
}
