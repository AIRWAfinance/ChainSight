import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getStorageBackend } from '@/lib/storage';
import { getSession } from '@/lib/auth/session';
import type { RiskReport } from '@/lib/engine/types';

export const runtime = 'nodejs';

const Body = z.object({
  report: z.unknown(),
});

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const limit = Math.min(200, Number(searchParams.get('limit') ?? '50'));
  const scans = await getStorageBackend().listScans(session.userId, limit);
  return NextResponse.json({ scans }, { status: 200 });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: 'invalid_request', message: 'Body must be { report: RiskReport }' },
      { status: 400 },
    );
  }

  const report = parsed.report as RiskReport;
  if (!report?.address || !report?.chain || typeof report?.riskScore !== 'number') {
    return NextResponse.json(
      { error: 'invalid_report', message: 'Report missing required fields' },
      { status: 400 },
    );
  }

  const summary = await getStorageBackend().saveScan(session.userId, report);
  return NextResponse.json({ scan: summary }, { status: 201 });
}
