import { NextResponse } from 'next/server';
import { getScanStore, getWatchlistStore } from '@/lib/storage';
import { runScan, ScanError } from '@/lib/engine/runScan';

export const runtime = 'nodejs';
export const maxDuration = 120;

interface RescanResult {
  watchId: string;
  address: string;
  chain: string;
  ok: boolean;
  oldScore: number | null;
  newScore: number | null;
  delta: number | null;
  error?: string;
}

export async function POST() {
  const watch = getWatchlistStore();
  const scans = getScanStore();
  const entries = watch.list().filter((e) => e.status === 'active');

  const results: RescanResult[] = [];

  for (const entry of entries) {
    const oldScore = entry.lastSeenScore;
    try {
      const report = await runScan(entry.address, { chain: entry.chain });
      scans.saveScan(report);
      watch.recordCheck(entry.id, report.riskScore);
      results.push({
        watchId: entry.id,
        address: entry.address,
        chain: entry.chain,
        ok: true,
        oldScore,
        newScore: report.riskScore,
        delta: oldScore === null ? null : report.riskScore - oldScore,
      });
    } catch (err: unknown) {
      const msg =
        err instanceof ScanError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Unknown error';
      results.push({
        watchId: entry.id,
        address: entry.address,
        chain: entry.chain,
        ok: false,
        oldScore,
        newScore: null,
        delta: null,
        error: msg,
      });
    }
  }

  return NextResponse.json({ checked: results.length, results }, { status: 200 });
}
