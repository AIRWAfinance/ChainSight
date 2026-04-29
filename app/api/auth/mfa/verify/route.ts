import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getStorageBackend } from '@/lib/storage';
import { getAuthenticatedSession } from '@/lib/auth/session';
import { verifyTotp } from '@/lib/auth/totp';
import { clientIpFrom, recordAuditEvent } from '@/lib/audit/log';

export const runtime = 'nodejs';

const Body = z.object({ code: z.string().min(6).max(8) });

/**
 * POST /api/auth/mfa/verify
 *
 * Confirm enrolment by submitting a code from the authenticator app. On
 * success, marks `totp_verified_at` so subsequent logins require TOTP.
 *
 * Used during initial setup. To complete login when MFA is already enrolled,
 * use /api/auth/mfa/login instead.
 */
export async function POST(req: Request) {
  const session = await getAuthenticatedSession();
  if (!session) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
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

  const store = getStorageBackend();
  const totp = await store.getUserTotpState(session.userId);
  if (!totp?.secret) {
    return NextResponse.json(
      { error: 'no_secret', message: 'MFA setup not started' },
      { status: 400 },
    );
  }

  const ok = verifyTotp(totp.secret, body.code);
  const ip = clientIpFrom(req);

  if (!ok) {
    await recordAuditEvent({
      actorUserId: session.userId,
      actorIp: ip,
      action: 'auth.login.fail',
      targetType: 'user',
      targetId: session.userId,
      payload: { event: 'mfa_verify_fail' },
    });
    return NextResponse.json(
      { error: 'invalid_code', message: 'Invalid TOTP code' },
      { status: 401 },
    );
  }

  await store.setUserTotpVerified(session.userId);

  await recordAuditEvent({
    actorUserId: session.userId,
    actorIp: ip,
    action: 'auth.register',
    targetType: 'user',
    targetId: session.userId,
    payload: { event: 'mfa_enrolled' },
  });

  return NextResponse.json({ ok: true, mfaEnabled: true }, { status: 200 });
}
