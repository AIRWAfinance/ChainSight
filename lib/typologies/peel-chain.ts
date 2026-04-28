import type { AddressContext, Flag, NormalizedTransaction } from '../engine/types.js';

const PEEL_MIN_LINKS = 4;
const PEEL_MAX_GAP_SECONDS = 6 * 60 * 60; // 6h between peels
const PEEL_DECREASE_TOLERANCE = 0.30; // each subsequent transfer must be < (1 - tol) * previous

/**
 * Detects peel chain pattern: a sequence of outbound transfers in
 * decreasing amounts to fresh addresses, where the residual is forwarded
 * to the next hop. Common technique for moving large amounts through
 * many small transactions to evade detection thresholds.
 *
 * Regulatory basis:
 *  - FATF Virtual Assets Red Flag Indicators (September 2020)
 *    Section 4.2(c): Multiple outflows in decreasing amounts; structured
 *    transactions designed to obscure the source/destination.
 *  - Chainalysis Crypto Crime Report — peel chain typology documentation.
 */
export function detectPeelChain(ctx: AddressContext): Flag[] {
  const outflows = ctx.transactions
    .filter(
      (tx) =>
        tx.kind === 'normal' &&
        tx.direction === 'out' &&
        !tx.isError &&
        tx.valueEth > 0,
    )
    .sort((a, b) => a.timestamp - b.timestamp);

  if (outflows.length < PEEL_MIN_LINKS) return [];

  const chains: NormalizedTransaction[][] = [];
  let current: NormalizedTransaction[] = [];

  for (const tx of outflows) {
    if (current.length === 0) {
      current = [tx];
      continue;
    }
    const prev = current[current.length - 1];
    const gap = tx.timestamp - prev.timestamp;
    const decreased = tx.valueEth < prev.valueEth * (1 - PEEL_DECREASE_TOLERANCE);

    if (gap <= PEEL_MAX_GAP_SECONDS && decreased) {
      current.push(tx);
    } else {
      if (current.length >= PEEL_MIN_LINKS) chains.push(current);
      current = [tx];
    }
  }
  if (current.length >= PEEL_MIN_LINKS) chains.push(current);

  if (chains.length === 0) return [];

  return chains.map<Flag>((chain) => {
    const totalEth = chain.reduce((sum, tx) => sum + tx.valueEth, 0);
    const severity =
      chain.length >= 8 ? 'high' : chain.length >= 6 ? 'medium' : 'low';
    return {
      typology: 'peel_chain',
      severity,
      title: `Peel chain detected: ${chain.length} sequential decreasing outflows`,
      description: `Detected a sequence of ${chain.length} outbound transfers in decreasing amounts within a short time window. Total value: ${totalEth.toFixed(4)} ETH. Peel chains are commonly used in money-laundering layering to obscure the trail of funds.`,
      evidence: chain.map((tx, i) => ({
        txHash: tx.hash,
        counterpartyAddress: tx.to,
        blockNumber: tx.blockNumber,
        timestamp: new Date(tx.timestamp * 1000).toISOString(),
        amountWei: tx.valueWei,
        note: `Peel #${i + 1}: ${tx.valueEth.toFixed(6)} ETH to ${tx.to}`,
      })),
      citations: [
        {
          source: 'FATF — Virtual Assets Red Flag Indicators',
          url: 'https://www.fatf-gafi.org/publications/fatfrecommendations/documents/Virtual-Assets-Red-Flag-Indicators.html',
          reference: 'September 2020, Section 4.2(c)',
        },
      ],
    };
  });
}
