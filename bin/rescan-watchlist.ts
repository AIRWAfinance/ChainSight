#!/usr/bin/env node
/**
 * Rescan every active watchlist entry across ALL users and send alerts.
 *
 * Designed to be run via cron (Linux) or Task Scheduler (Windows).
 * Example cron schedule to run every 4 hours:
 *   0 0,4,8,12,16,20 * * *   cd /path/to/chainsight && npm run rescan
 */

import 'dotenv/config';
import { getStorageBackend } from '../lib/storage/index.js';
import { runScan, ScanError } from '../lib/engine/runScan.js';
import { sendScoreAlert } from '../lib/notify/email.js';

const ALERT_DELTA_THRESHOLD = Number(
  process.env['CHAINSIGHT_ALERT_DELTA'] ?? '5',
);

async function main(): Promise<void> {
  const store = getStorageBackend();
  const entries = await store.listAllActiveWatch();

  if (entries.length === 0) {
    console.log('[rescan] Watchlist is empty.');
    return;
  }

  console.log(`[rescan] Rescanning ${entries.length} active entries across all users...`);
  let ok = 0;
  let failed = 0;
  let movers = 0;
  let alerts = 0;

  for (const entry of entries) {
    const oldScore = entry.lastSeenScore;
    try {
      const report = await runScan(entry.address, { chain: entry.chain });
      await store.saveScan(entry.userId, report);
      await store.recordWatchCheck(entry.id, report.riskScore);
      const delta = oldScore === null ? null : report.riskScore - oldScore;
      const arrow =
        delta === null ? '·' : delta > 0 ? `↑ +${delta}` : delta < 0 ? `↓ ${delta}` : '=';
      if (delta !== null && delta !== 0) movers++;

      if (
        entry.alertEmail &&
        delta !== null &&
        Math.abs(delta) >= ALERT_DELTA_THRESHOLD
      ) {
        const sent = await sendScoreAlert({
          to: entry.alertEmail,
          address: entry.address,
          chain: entry.chain,
          oldScore,
          newScore: report.riskScore,
          delta,
          report,
        });
        if (sent) alerts++;
      }

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

  console.log(
    `[rescan] Done. ok=${ok} failed=${failed} score-changes=${movers} alerts-sent=${alerts}`,
  );
}

main().catch((err) => {
  console.error('[rescan] FATAL:', err);
  process.exit(1);
});
