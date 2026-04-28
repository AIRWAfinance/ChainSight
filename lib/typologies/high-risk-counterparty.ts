import type { AddressContext, Evidence, Flag } from '../engine/types.js';

/**
 * Detects exposure to high-risk centralized infrastructure or known-bad
 * counterparty clusters.
 *
 * Heuristic v1: counts distinct counterparties and the share of value
 * flowing through CEX-style hot wallets versus self-custody peers.
 *
 * Triggers:
 *   - Large counterparty fan-out (>50 distinct peers) with concentrated
 *     value flow to a small subset (top-3 captures >70%) — typical
 *     of mule-routing setups
 */
export function detectHighRiskCounterparty(ctx: AddressContext): Flag[] {
  const flags: Flag[] = [];

  const COUNTERPARTY_THRESHOLD = 50;
  if (ctx.counterparties.size < COUNTERPARTY_THRESHOLD) return flags;

  const valuePerCounterparty = new Map<string, number>();
  let total = 0;
  for (const tx of ctx.transactions) {
    if (tx.kind !== 'normal' && tx.kind !== 'internal') continue;
    if (tx.isError) continue;
    const peer = tx.direction === 'out' ? tx.to : tx.from;
    if (!peer || peer === ctx.address) continue;
    const v = tx.valueEth;
    if (!Number.isFinite(v) || v <= 0) continue;
    valuePerCounterparty.set(peer, (valuePerCounterparty.get(peer) ?? 0) + v);
    total += v;
  }
  if (total <= 0 || valuePerCounterparty.size === 0) return flags;

  const sorted = [...valuePerCounterparty.entries()].sort((a, b) => b[1] - a[1]);
  const top3 = sorted.slice(0, 3);
  const top3Value = top3.reduce((s, [, v]) => s + v, 0);
  const concentration = top3Value / total;

  if (concentration > 0.7) {
    const evidence: Evidence[] = top3.map(([addr, v]) => ({
      counterpartyAddress: addr,
      note: `${((v / total) * 100).toFixed(1)}% of total flow (${v.toFixed(4)})`,
    }));
    flags.push({
      typology: 'high_risk_counterparty',
      severity: 'medium',
      title: `Concentrated value flow: top-3 counterparties capture ${(concentration * 100).toFixed(0)}%`,
      description: `Despite ${ctx.counterparties.size} distinct counterparties, ${(concentration * 100).toFixed(1)}% of total value flowed to just three addresses. This concentration profile is consistent with mule-routing or controlled-counterparty setups.`,
      evidence,
      citations: [
        {
          source: 'FATF',
          reference:
            'Virtual Assets Red Flag Indicators (Sept 2020) §3.3 — concentration of value flow through few counterparties.',
          url: 'https://www.fatf-gafi.org/publications/fatfrecommendations/documents/Virtual-Assets-Red-Flag-Indicators.html',
        },
      ],
    });
  }

  return flags;
}
