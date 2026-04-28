import type { AddressContext, Flag } from '../engine/types.js';
import { lookupMixer } from '../data/known-bad.js';

/**
 * Detects transactions with known cryptocurrency mixers (Tornado Cash, etc.).
 *
 * Regulatory basis:
 *  - FATF Virtual Assets Red Flag Indicators (September 2020)
 *    Section 4.2(b): "Use of mixers/tumblers" is a red flag for placement
 *    and layering stages of money laundering.
 *  - FinCEN Advisory FIN-2019-A003 (May 2019): Mixers used to obfuscate
 *    transaction history are a significant ML/TF risk indicator.
 */
export function detectMixerExposure(ctx: AddressContext): Flag[] {
  const flags: Flag[] = [];
  const hits = new Map<string, { txs: typeof ctx.transactions; label: string }>();

  for (const tx of ctx.transactions) {
    const counterparty = tx.direction === 'out' ? tx.to : tx.from;
    if (!counterparty || counterparty === ctx.address.toLowerCase()) continue;

    const mixer = lookupMixer(counterparty);
    if (!mixer) continue;

    const existing = hits.get(counterparty) ?? { txs: [], label: mixer.label };
    existing.txs.push(tx);
    hits.set(counterparty, existing);
  }

  for (const [counterparty, { txs, label }] of hits) {
    const mixer = lookupMixer(counterparty)!;
    const totalEth = txs.reduce((sum, tx) => sum + tx.valueEth, 0);
    const severity = totalEth >= 10 ? 'critical' : totalEth >= 1 ? 'high' : 'medium';

    flags.push({
      typology: 'mixer_exposure',
      severity,
      title: `Transactions with mixer: ${label}`,
      description: `Subject address transacted with ${label} (${counterparty}). Mixers are designed to obscure transaction trails and are a FATF-recognised red flag indicator. Total value across detected transactions: ${totalEth.toFixed(4)} ETH.`,
      evidence: txs.map((tx) => ({
        txHash: tx.hash,
        counterpartyAddress: counterparty,
        blockNumber: tx.blockNumber,
        timestamp: new Date(tx.timestamp * 1000).toISOString(),
        amountWei: tx.valueWei,
        note: `${tx.direction.toUpperCase()} ${tx.valueEth.toFixed(6)} ETH`,
      })),
      citations: [
        mixer.source,
        {
          source: 'FATF — Virtual Assets Red Flag Indicators of Money Laundering and Terrorist Financing',
          url: 'https://www.fatf-gafi.org/publications/fatfrecommendations/documents/Virtual-Assets-Red-Flag-Indicators.html',
          reference: 'September 2020, Section 4.2(b)',
        },
      ],
    });
  }

  return flags;
}
