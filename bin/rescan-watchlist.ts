#!/usr/bin/env node
/**
 * Rescan every active watchlist entry and save fresh reports.
 *
 * Designed to be run via cron (Linux) or Task Scheduler (Windows).
 * Example cron schedule to run every 4 hours:
 *   0 0,4,8,12,16,20 * * *   cd /path/to/chainsight && npm run rescan
 */

import 'dotenv/config';
import { getScanStore, getWatchlistStore } from '../lib/storage/index.js';
import { runScan, ScanError } from '../lib/engine/runScan.js';

async function main(): Promise<void> {
  const watch = getWatchlistStore();
  const scans = getScanStore();
  const entries = watch.list().filter((e) => e.status === 'active');

  if (entries.length === 0) {
    console.log('[rescan] Watchlist is empty.');
    return;
  }

  console.log(`[rescan] Rescanning ${entries.length} active entries...`);
  let ok = 0;
  let failed = 0;
  let movers = 0;

  for (const entry of entries) {
    const oldScore = entry.lastSeenScore;
    try {
      const report = await runScan(entry.address, { chain: entry.chain });
      scans.saveScan(report);
      watch.recordCheck(entry.id, report.riskScore);
      const delta =
        oldScore === null ? null : report.riskScore - oldScore;
      const arrow =
        delta === null ? '·' : delta > 0 ? `↑ +${delta}` : delta < 0 ? `↓ ${delta}` : '=';
      if (delta !== null && delta !== 0) movers++;
      console.log(
        `[rescan] ${entry.chain}/${entry.address.slice(0, 10)}…${entry.address.slice(-4)}` +
          ` score=${report.riskScore} ${arrow}` +
          ` flags=${report.flags.length}`,
      );
      ok++;
    } catch (err: unknown) {
      const msg =
        err instanceof ScanError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Unknown error';
      console.error(`[rescan] FAIL ${entry.address}: ${msg}`);
      failed++;
    }
  }

  console.log(`[rescan] Done. ok=${ok} failed=${failed} score-changes=${movers}`);
}

main().catch((err) => {
  console.error('[rescan] FATAL:', err);
  process.exit(1);
});
