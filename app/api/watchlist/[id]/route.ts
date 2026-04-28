import { NextResponse } from 'next/server';
import { getWatchlistStore } from '@/lib/storage';

export const runtime = 'nodejs';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ok = getWatchlistStore().remove(id);
  if (!ok) {
    return NextResponse.json(
      { error: 'not_found', message: 'Entry not found' },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
