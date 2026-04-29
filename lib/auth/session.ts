import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'chainsight_session';
const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days
const MFA_PENDING_TTL = 60 * 10; // 10 minutes — short-lived "half-auth"

function getSecret(): Uint8Array {
  const secret = process.env['CHAINSIGHT_SESSION_SECRET'];
  if (!secret || secret.length < 32) {
    throw new Error(
      'CHAINSIGHT_SESSION_SECRET must be set to a string of at least 32 characters.',
    );
  }
  return new TextEncoder().encode(secret);
}

export interface Session {
  userId: string;
  email: string;
  /**
   * When true, the user has completed both password auth AND TOTP (or has no
   * TOTP enrolled). When false, the cookie is a "MFA pending" token granting
   * access only to the MFA-completion endpoint.
   */
  mfa: boolean;
  iat: number;
  exp: number;
}

export async function signSession(
  userId: string,
  email: string,
  opts: { mfa: boolean } = { mfa: true },
): Promise<string> {
  const ttl = opts.mfa ? SESSION_TTL : MFA_PENDING_TTL;
  return await new SignJWT({ userId, email, mfa: opts.mfa })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ttl}s`)
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      typeof payload.userId === 'string' &&
      typeof payload.email === 'string' &&
      typeof payload.iat === 'number' &&
      typeof payload.exp === 'number'
    ) {
      // mfa defaults to true for legacy tokens issued before this field existed.
      const mfa =
        typeof payload.mfa === 'boolean' ? payload.mfa : true;
      return {
        userId: payload.userId,
        email: payload.email,
        mfa,
        iat: payload.iat,
        exp: payload.exp,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifySession(token);
}

/**
 * Returns the session ONLY if MFA is complete. MFA-pending sessions are
 * treated as unauthenticated for everything except the MFA-completion endpoint.
 */
export async function getAuthenticatedSession(): Promise<Session | null> {
  const session = await getSession();
  if (!session) return null;
  if (!session.mfa) return null;
  return session;
}

export async function requireSession(): Promise<Session> {
  const session = await getAuthenticatedSession();
  if (!session) throw new Error('UNAUTHENTICATED');
  return session;
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
