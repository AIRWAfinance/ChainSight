import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getStorageBackend } from '@/lib/storage';
import { getAuthenticatedSession } from '@/lib/auth/session';
import { verifyTotp } from '@/lib/auth/totp';
import { authenticateUser } from '@/lib/auth/users';
import { clientIpFrom, recordAuditEvent } from '@/lib/audit/log';

export const runtime = 'nodejs';

const Body = z.object({
  password: z.string().min(1),
  code: z.string().min(6).max(8),
});

/**
 * POST /api/auth/mfa/disable
 *
 * Disable TOTP for the current user. Requires BOTH the current password AND
 * a valid current TOTP code — guards against a stolen MFA-completed session
 * cookie being used to silently disable MFA.
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
      { error: 'invalid_request', message: 'password and code required' },
      { status: 400 },
    );
  }

  const ip = clientIpFrom(req);
  const user = await authenticateUser(session.email, body.password);
  if (!user) {
    await recordAuditEvent({
      actorUserId: session.userId,
      actorIp: ip,
      action: 'auth.login.fail',
      targetType: 'user',
      targetId: session.userId,
      payload: { event: 'mfa_disable_password_fail' },
    });
    return NextResponse.json(
      { error: 'invalid_credentials', message: 'Invalid password' },
      { status: 401 },
    );
  }

  const totp = await getStorageBackend().getUserTotpState(session.userId);
  if (!totp?.secret || !totp.verifiedAt) {
    return NextResponse.json(
      { error: 'no_mfa_enrolled', message: 'MFA not enrolled' },
      { status: 400 },
    );
  }

  if (!verifyTotp(totp.secret, body.code)) {
    await recordAuditEvent({
      actorUserId: session.userId,
      actorIp: ip,
      action: 'auth.login.fail',
      targetType: 'user',
      targetId: session.userId,
      payload: { event: 'mfa_disable_code_fail' },
    });
    return NextResponse.json(
      { error: 'invalid_code', message: 'Invalid TOTP code' },
      { status: 401 },
    );
  }

  await getStorageBackend().clearUserTotp(session.userId);

  await recordAuditEvent({
    actorUserId: session.userId,
    actorIp: ip,
    action: 'auth.register',
    targetType: 'user',
    targetId: session.userId,
    payload: { event: 'mfa_disabled' },
  });

  return NextResponse.json({ ok: true, mfaEnabled: false }, { status: 200 });
}
