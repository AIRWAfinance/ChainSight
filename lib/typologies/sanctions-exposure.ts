import type { AddressContext, Flag } from '../engine/types.js';
import { isSanctioned } from '../data/sanctions.js';

/**
 * Detects direct transactions between the subject address and OFAC-sanctioned
 * addresses. Direct sanctions exposure is the most severe AML risk indicator
 * for crypto wallets.
 *
 * Regulatory basis:
 *  - U.S. Treasury OFAC SDN List
 *  - FATF Updated Guidance for a Risk-Based Approach to Virtual Assets and VASPs (2021)
 *    paragraph 87: "VASPs and other obligated entities should screen for
 *    sanctioned persons and addresses"
 */
export function detectSanctionsExposure(ctx: AddressContext): Flag[] {
  const flags: Flag[] = [];
  const hits = new Map<string, { txs: typeof ctx.transactions }>();

  for (const tx of ctx.transactions) {
    const counterparty = tx.direction === 'out' ? tx.to : tx.from;
    if (!counterparty || counterparty === ctx.address.toLowerCase()) continue;

    const sanction = isSanctioned(counterparty);
    if (!sanction) continue;

    const existing = hits.get(counterparty) ?? { txs: [] };
    existing.txs.push(tx);
    hits.set(counterparty, existing);
  }

  for (const [counterparty, { txs }] of hits) {
    const sanction = isSanctioned(counterparty)!;
    flags.push({
      typology: 'sanctions_exposure',
      severity: 'critical',
      title: `Direct transactions with sanctioned address (${sanction.entity ?? sanction.list})`,
      description: `Subject address transacted directly with a sanctioned counterparty (${counterparty}) listed under ${sanction.list}${sanction.program ? ` program ${sanction.program}` : ''}. Direct exposure to OFAC-sanctioned addresses creates strict-liability sanctions risk regardless of intent.`,
      evidence: txs.map((tx) => ({
        txHash: tx.hash,
        counterpartyAddress: counterparty,
        blockNumber: tx.blockNumber,
        timestamp: new Date(tx.timestamp * 1000).toISOString(),
        amountWei: tx.valueWei,
        note: `${tx.direction.toUpperCase()} ${tx.valueEth.toFixed(6)} ETH (${tx.kind})`,
      })),
      citations: [
        sanction.source,
        {
          source: 'FATF — Updated Guidance for a Risk-Based Approach to Virtual Assets and VASPs',
          url: 'https://www.fatf-gafi.org/publications/fatfrecommendations/documents/Updated-Guidance-VA-VASP.html',
          reference: 'October 2021, paragraph 87',
        },
      ],
    });
  }

  return flags;
}
