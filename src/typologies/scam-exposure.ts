import type { AddressContext, Flag, Severity } from '../engine/types.js';
import { lookupScam } from '../data/known-bad.js';

/**
 * Detects transactions with known scam, phishing, ransomware, or darknet
 * marketplace addresses.
 *
 * Regulatory basis:
 *  - FATF Virtual Assets Red Flag Indicators (September 2020)
 *    Section 4.5: Funds derived from criminal activity (ransomware, fraud,
 *    darknet marketplaces) constitute a high-risk typology.
 *  - FinCEN Advisory FIN-2020-A006 (October 2020): Ransomware-related
 *    transactions in convertible virtual currency.
 */
export function detectScamExposure(ctx: AddressContext): Flag[] {
  const flags: Flag[] = [];
  const hits = new Map<string, { txs: typeof ctx.transactions }>();

  for (const tx of ctx.transactions) {
    const counterparty = tx.direction === 'out' ? tx.to : tx.from;
    if (!counterparty || counterparty === ctx.address.toLowerCase()) continue;

    const scam = lookupScam(counterparty);
    if (!scam) continue;

    const existing = hits.get(counterparty) ?? { txs: [] };
    existing.txs.push(tx);
    hits.set(counterparty, existing);
  }

  for (const [counterparty, { txs }] of hits) {
    const scam = lookupScam(counterparty)!;
    const severity: Severity =
      scam.category === 'ransomware'
        ? 'critical'
        : scam.category === 'darknet'
          ? 'high'
          : 'high';

    flags.push({
      typology: 'scam_exposure',
      severity,
      title: `Transactions with ${scam.category} address: ${scam.label}`,
      description: `Subject address transacted with a known ${scam.category} address (${counterparty}: ${scam.label}). ${scam.description ?? ''}`.trim(),
      evidence: txs.map((tx) => ({
        txHash: tx.hash,
        counterpartyAddress: counterparty,
        blockNumber: tx.blockNumber,
        timestamp: new Date(tx.timestamp * 1000).toISOString(),
        amountWei: tx.valueWei,
        note: `${tx.direction.toUpperCase()} ${tx.valueEth.toFixed(6)} ETH`,
      })),
      citations: [
        scam.source,
        {
          source: 'FATF — Virtual Assets Red Flag Indicators',
          url: 'https://www.fatf-gafi.org/publications/fatfrecommendations/documents/Virtual-Assets-Red-Flag-Indicators.html',
          reference: 'September 2020, Section 4.5',
        },
      ],
    });
  }

  return flags;
}
