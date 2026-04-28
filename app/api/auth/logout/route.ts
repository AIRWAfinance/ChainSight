import { NextResponse } from 'next/server';
import { clearSessionCookie, getSession } from '@/lib/auth/session';
import { clientIpFrom, logLogout } from '@/lib/audit/log';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const session = await getSession();
  await clearSessionCookie();
  if (session) {
    await logLogout({ actorIp: clientIpFrom(req), userId: session.userId });
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
