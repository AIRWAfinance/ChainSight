import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getStorageBackend } from '@/lib/storage';

export const runtime = 'nodejs';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  const totp = await getStorageBackend().getUserTotpState(session.userId);
  return NextResponse.json(
    {
      user: {
        id: session.userId,
        email: session.email,
        mfaEnabled: Boolean(totp?.verifiedAt),
        mfaPending: !session.mfa,
      },
    },
    { status: 200 },
  );
}
