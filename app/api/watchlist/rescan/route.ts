import { NextResponse } from 'next/server';
import { getStorageBackend } from '@/lib/storage';
import { runScan, ScanError } from '@/lib/engine/runScan';
import { getSession } from '@/lib/auth/session';
import { sendScoreAlert } from '@/lib/notify/email';
import type { WatchlistEntry } from '@/lib/storage';

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
  alertSent: boolean;
  error?: string;
}

const ALERT_DELTA_THRESHOLD = Number(
  process.env['CHAINSIGHT_ALERT_DELTA'] ?? '5',
);

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const store = getStorageBackend();
  const entries = (await store.listWatch(session.userId)).filter(
    (e: WatchlistEntry) => e.status === 'active',
  );

  const results: RescanResult[] = [];

  for (const entry of entries) {
    const oldScore = entry.lastSeenScore;
    try {
      const report = await runScan(entry.address, { chain: entry.chain });
      await store.saveScan(session.userId, report);
      await store.recordWatchCheck(entry.id, report.riskScore);
      const delta = oldScore === null ? null : report.riskScore - oldScore;

      let alertSent = false;
      const shouldAlert =
        entry.alertEmail &&
        delta !== null &&
        Math.abs(delta) >= ALERT_DELTA_THRESHOLD;
      if (shouldAlert && entry.alertEmail) {
        alertSent = await sendScoreAlert({
          to: entry.alertEmail,
          address: entry.address,
          chain: entry.chain,
          oldScore,
          newScore: report.riskScore,
          delta,
          report,
        });
      }

      results.push({
        watchId: entry.id,
        address: entry.address,
        chain: entry.chain,
        ok: true,
        oldScore,
        newScore: report.riskScore,
        delta,
        alertSent,
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
        alertSent: false,
        error: msg,
      });
    }
  }

  return NextResponse.json({ checked: results.length, results }, { status: 200 });
}
