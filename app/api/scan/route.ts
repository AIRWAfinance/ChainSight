import { NextResponse } from 'next/server';
import { z } from 'zod';
import { runScan, ScanError } from '@/lib/engine/runScan';
import { getSession } from '@/lib/auth/session';
import { clientIpFrom, logScanRun } from '@/lib/audit/log';

export const runtime = 'nodejs';
export const maxDuration = 60;

const Body = z.object({
  address: z.string().min(1),
  chain: z.string().optional(),
});

export async function POST(req: Request) {
  let parsed;
  try {
    const json = await req.json();
    parsed = Body.parse(json);
  } catch {
    return NextResponse.json(
      { error: 'invalid_request', message: 'Body must be { address: string }' },
      { status: 400 },
    );
  }

  const session = await getSession();
  const ip = clientIpFrom(req);

  try {
    const report = await runScan(parsed.address, { chain: parsed.chain });
    await logScanRun({
      actorUserId: session?.userId ?? null,
      actorIp: ip,
      address: report.address,
      chain: report.chain,
      riskScore: report.riskScore,
      flagsCount: report.flags.length,
      rulesVersion: report.meta.rulesVersion,
      rulesFingerprint: report.meta.rulesFingerprint,
    });
    return NextResponse.json({ report }, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof ScanError) {
      return NextResponse.json(
        { error: err.code, message: err.message },
        { status: err.status },
      );
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'internal_error', message },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { ok: true, service: 'chainsight', version: '0.2.0' },
    { status: 200 },
  );
}
