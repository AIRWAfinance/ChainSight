import type {
  AddressContext,
  NormalizedTransaction,
  RiskReport,
} from './types.js';
import { runAllTypologies, ALL_TYPOLOGIES } from '../typologies/index.js';
import { computeRiskScore, recommendation } from './scorer.js';

const VERSION = '0.1.0';

export function buildContext(
  address: string,
  transactions: NormalizedTransaction[],
): AddressContext {
  const lower = address.toLowerCase();
  const counterparties = new Set<string>();
  let firstSeen: number | null = null;
  let lastSeen: number | null = null;

  for (const tx of transactions) {
    if (tx.from && tx.from !== lower) counterparties.add(tx.from);
    if (tx.to && tx.to !== lower) counterparties.add(tx.to);
    if (firstSeen === null || tx.timestamp < firstSeen) firstSeen = tx.timestamp;
    if (lastSeen === null || tx.timestamp > lastSeen) lastSeen = tx.timestamp;
  }

  return {
    address: lower,
    transactions,
    firstSeen,
    lastSeen,
    counterparties,
  };
}

export function analyze(
  address: string,
  transactions: NormalizedTransaction[],
  dataSourcesUsed: string[] = ['Etherscan', 'OFAC SDN', 'Curated mixer/scam lists'],
): RiskReport {
  const ctx = buildContext(address, transactions);
  const flags = runAllTypologies(ctx);
  const score = computeRiskScore(flags);

  return {
    address: ctx.address,
    chain: 'ethereum',
    scannedAt: new Date().toISOString(),
    riskScore: score,
    recommendation: recommendation(score, flags),
    flags,
    summary: {
      totalTransactions: transactions.length,
      firstSeen: ctx.firstSeen ? new Date(ctx.firstSeen * 1000).toISOString() : null,
      lastSeen: ctx.lastSeen ? new Date(ctx.lastSeen * 1000).toISOString() : null,
      distinctCounterparties: ctx.counterparties.size,
    },
    meta: {
      chainsightVersion: VERSION,
      typologiesEvaluated: [...ALL_TYPOLOGIES],
      dataSourcesUsed,
    },
  };
}
