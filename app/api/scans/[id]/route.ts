import { NextResponse } from 'next/server';
import { getScanStore } from '@/lib/storage';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const scan = getScanStore().getScan(id);
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
  const { id } = await params;
  const ok = getScanStore().deleteScan(id);
  if (!ok) {
    return NextResponse.json(
      { error: 'not_found', message: 'Scan not found' },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
