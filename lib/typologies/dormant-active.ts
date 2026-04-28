import type { AddressContext, Evidence, Flag } from '../engine/types.js';

/**
 * Detects long-dormant wallets that suddenly reactivate.
 *
 * Heuristic: find a gap of >365 days between two adjacent transactions,
 * followed by a burst of activity (>= 5 transactions in the next 7 days)
 * after the dormant period.
 *
 * Severity scales with the size of the burst.
 */

const DORMANT_DAYS = 365;
const BURST_WINDOW_DAYS = 7;
const BURST_MIN_TX = 5;

const DAY = 86_400;

export function detectDormantActive(ctx: AddressContext): Flag[] {
  const txs = [...ctx.transactions]
    .filter((t) => !t.isError)
    .sort((a, b) => a.timestamp - b.timestamp);
  if (txs.length < BURST_MIN_TX + 2) return [];

  const flags: Flag[] = [];

  for (let i = 1; i < txs.length; i++) {
    const prev = txs[i - 1];
    const cur = txs[i];
    const gapDays = (cur.timestamp - prev.timestamp) / DAY;
    if (gapDays < DORMANT_DAYS) continue;

    // Count transactions inside the burst window
    const windowEnd = cur.timestamp + BURST_WINDOW_DAYS * DAY;
    let burst = 0;
    for (let j = i; j < txs.length && txs[j].timestamp <= windowEnd; j++) burst++;
    if (burst < BURST_MIN_TX) continue;

    const evidence: Evidence[] = [
      {
        txHash: prev.hash,
        timestamp: new Date(prev.timestamp * 1000).toISOString(),
        note: `last activity before dormant period (${Math.round(gapDays)}d gap)`,
      },
      {
        txHash: cur.hash,
        timestamp: new Date(cur.timestamp * 1000).toISOString(),
        note: `first activity after dormant period`,
      },
      ...txs.slice(i + 1, i + Math.min(burst, 5)).map<Evidence>((t) => ({
        txHash: t.hash,
        timestamp: new Date(t.timestamp * 1000).toISOString(),
        note: 'burst activity',
      })),
    ];

    const severity = burst >= 20 ? 'high' : burst >= 10 ? 'medium' : 'low';

    flags.push({
      typology: 'dormant_active',
      severity,
      title: `Dormant-then-active: ${Math.round(gapDays)}d silence, ${burst} tx in next ${BURST_WINDOW_DAYS}d`,
      description: `The wallet was inactive for ${Math.round(gapDays)} days, then performed ${burst} transactions inside a ${BURST_WINDOW_DAYS}-day window. Reactivation patterns following extended dormancy are a known indicator of compromised keys, recovered private keys, or coordinated washout activity.`,
      evidence,
      citations: [
        {
          source: 'FATF',
          reference:
            'Virtual Assets Red Flag Indicators (Sept 2020) §3.5(c) — sudden reactivation of long-dormant addresses with high-volume activity.',
          url: 'https://www.fatf-gafi.org/publications/fatfrecommendations/documents/Virtual-Assets-Red-Flag-Indicators.html',
        },
      ],
    });

    // Skip ahead past this burst to avoid double-flagging
    i += burst - 1;
  }

  return flags;
}
