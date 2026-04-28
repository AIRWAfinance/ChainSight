import type { AddressContext, Flag, NormalizedTransaction, Severity } from '../engine/types.js';

const LAYERING_WINDOW_SECONDS = 60 * 60; // 1 hour
const LAYERING_VALUE_TOLERANCE = 0.05; // 5% of inflow value
const MIN_PASS_THROUGH_USD_EQUIV_ETH = 0.01;
const MIN_MATCHES_FOR_FLAG = 3;
const CRITICAL_MATCH_THRESHOLD = 25;
const CRITICAL_NOTIONAL_ETH = 100;

/**
 * Detects layering: rapid pass-through of value, where ETH arrives and is
 * forwarded out within a short time window in similar amounts. A hallmark
 * pattern of money-laundering layering.
 *
 * Each outflow can be matched at most once (consumed-set semantics) so the
 * detector cannot double-count.
 *
 * Regulatory basis:
 *  - FATF Virtual Assets Red Flag Indicators (September 2020)
 *    Section 4.2(a): "Funds are immediately transferred to other VASPs
 *    or wallets" / pass-through behaviour.
 *  - Egmont Group / FATF — Money Laundering Through the Stages of
 *    Placement, Layering, Integration.
 */
export function detectLayering(ctx: AddressContext): Flag[] {
  const inflows = ctx.transactions
    .filter(
      (tx) =>
        tx.kind === 'normal' &&
        tx.direction === 'in' &&
        !tx.isError &&
        tx.valueEth >= MIN_PASS_THROUGH_USD_EQUIV_ETH,
    )
    .sort((a, b) => a.timestamp - b.timestamp);

  const outflows = ctx.transactions
    .filter(
      (tx) =>
        tx.kind === 'normal' &&
        tx.direction === 'out' &&
        !tx.isError &&
        tx.valueEth >= MIN_PASS_THROUGH_USD_EQUIV_ETH,
    )
    .sort((a, b) => a.timestamp - b.timestamp);

  const matches: Array<{
    inflow: NormalizedTransaction;
    outflow: NormalizedTransaction;
  }> = [];
  const consumed = new Set<string>();

  for (const inflow of inflows) {
    const matched = outflows.find(
      (out) =>
        !consumed.has(out.hash) &&
        out.timestamp > inflow.timestamp &&
        out.timestamp - inflow.timestamp <= LAYERING_WINDOW_SECONDS &&
        Math.abs(out.valueEth - inflow.valueEth) /
          Math.max(inflow.valueEth, 1e-9) <=
          LAYERING_VALUE_TOLERANCE,
    );
    if (matched) {
      matches.push({ inflow, outflow: matched });
      consumed.add(matched.hash);
    }
  }

  if (matches.length < MIN_MATCHES_FOR_FLAG) return [];

  const totalPassedThrough = matches.reduce(
    (sum, m) => sum + m.inflow.valueEth,
    0,
  );

  let severity: Severity = 'medium';
  if (
    matches.length >= CRITICAL_MATCH_THRESHOLD ||
    totalPassedThrough >= CRITICAL_NOTIONAL_ETH
  ) {
    severity = 'critical';
  } else if (matches.length >= 10) {
    severity = 'high';
  }

  return [
    {
      typology: 'layering',
      severity,
      title: `Layering pattern: ${matches.length} rapid pass-through transactions`,
      description: `Detected ${matches.length} instances where inbound ETH was forwarded out within ${LAYERING_WINDOW_SECONDS / 60} minutes in a near-identical amount (within ${LAYERING_VALUE_TOLERANCE * 100}% tolerance). Total value passed through: ${totalPassedThrough.toFixed(4)} ETH. This is a classic layering pattern in the money-laundering process.`,
      evidence: matches.flatMap(({ inflow, outflow }) => [
        {
          txHash: inflow.hash,
          counterpartyAddress: inflow.from,
          blockNumber: inflow.blockNumber,
          timestamp: new Date(inflow.timestamp * 1000).toISOString(),
          amountWei: inflow.valueWei,
          note: `IN ${inflow.valueEth.toFixed(6)} ETH from ${inflow.from}`,
        },
        {
          txHash: outflow.hash,
          counterpartyAddress: outflow.to,
          blockNumber: outflow.blockNumber,
          timestamp: new Date(outflow.timestamp * 1000).toISOString(),
          amountWei: outflow.valueWei,
          note: `OUT ${outflow.valueEth.toFixed(6)} ETH to ${outflow.to} (+${outflow.timestamp - inflow.timestamp}s)`,
        },
      ]),
      citations: [
        {
          source: 'FATF — Virtual Assets Red Flag Indicators',
          url: 'https://www.fatf-gafi.org/publications/fatfrecommendations/documents/Virtual-Assets-Red-Flag-Indicators.html',
          reference: 'September 2020, Section 4.2(a)',
        },
      ],
    },
  ];
}
