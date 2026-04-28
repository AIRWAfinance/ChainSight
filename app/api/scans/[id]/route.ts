import { NextResponse } from 'next/server';
import { getStorageBackend } from '@/lib/storage';
import { getSession } from '@/lib/auth/session';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }
  const { id } = await params;
  const scan = await getStorageBackend().getScan(session.userId, id);
  if (!scan) {
    return NextResponse.json(
      { error: 'not_found', message: 'Scan not found' },
      { status: 404 },
    );
  }
  return NextResponse.json({ scan }, { status: 200 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }
  const { id } = await params;
  const ok = await getStorageBackend().deleteScan(session.userId, id);
  if (!ok) {
    return NextResponse.json(
      { error: 'not_found', message: 'Scan not found' },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
