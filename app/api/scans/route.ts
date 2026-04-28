import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getScanStore } from '@/lib/storage';
import type { RiskReport } from '@/lib/engine/types';

export const runtime = 'nodejs';

const Body = z.object({
  report: z.unknown(),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(200, Number(searchParams.get('limit') ?? '50'));
  const scans = getScanStore().listScans(limit);
  return NextResponse.json({ scans }, { status: 200 });
}

export async function POST(req: Request) {
  let parsed;
  try {
    const json = await req.json();
    parsed = Body.parse(json);
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

  const summary = getScanStore().saveScan(report);
  return NextResponse.json({ scan: summary }, { status: 201 });
}
