import { NextResponse } from 'next/server';
import { getStorageBackend } from '@/lib/storage';
import { getAuthenticatedSession } from '@/lib/auth/session';
import { generateSecret, otpauthUri } from '@/lib/auth/totp';
import { clientIpFrom, recordAuditEvent } from '@/lib/audit/log';

export const runtime = 'nodejs';

/**
 * POST /api/auth/mfa/setup
 *
 * Begin TOTP enrolment. Generates a fresh secret, persists it on the user
 * record, and returns the secret + otpauth URI for the user's authenticator
 * app. The secret is NOT considered active until POST /api/auth/mfa/verify
 * succeeds with a code derived from it.
 *
 * Calling this endpoint while already enrolled rotates the secret. The
 * caller's session must be MFA-complete to access this — i.e. you must have
 * completed any existing TOTP first if one is enrolled.
 */
export async function POST(req: Request) {
  const session = await getAuthenticatedSession();
  if (!session) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const secret = generateSecret();
  await getStorageBackend().setUserTotpSecret(session.userId, secret);

  const issuer = process.env['CHAINSIGHT_MFA_ISSUER'] ?? 'ChainSight';
  const uri = otpauthUri({ secret, accountName: session.email, issuer });

  await recordAuditEvent({
    actorUserId: session.userId,
    actorIp: clientIpFrom(req),
    action: 'auth.register',
    targetType: 'user',
    targetId: session.userId,
    payload: { event: 'mfa_setup_started' },
  });

  return NextResponse.json({ secret, otpauthUri: uri }, { status: 200 });
}
