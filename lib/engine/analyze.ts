import type {
  AddressContext,
  ChainSlug,
  NormalizedTransaction,
  RiskReport,
} from './types.js';
import { runAllTypologies, ALL_TYPOLOGIES } from '../typologies/index.js';
import {
  computeRiskScore,
  computeScoreBreakdown,
  recommendation,
} from './scorer.js';
import { labelFor } from '../data/labels.js';
import { computeGraph } from './graph.js';

const VERSION = '0.3.0';

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

export interface AnalyzeOptions {
  chain?: ChainSlug;
  dataSourcesUsed?: string[];
}

export function analyze(
  address: string,
  transactions: NormalizedTransaction[],
  opts: AnalyzeOptions = {},
): RiskReport {
  const chain = opts.chain ?? 'ethereum';
  const dataSourcesUsed = opts.dataSourcesUsed ?? [
    'Etherscan v2',
    'OFAC SDN',
    'Curated mixer/scam lists',
  ];

  const ctx = buildContext(address, transactions);
  const rawFlags = runAllTypologies(ctx);
  const flags = rawFlags.map((flag) => ({
    ...flag,
    evidence: flag.evidence.map((e) => {
      const label = labelFor(e.counterpartyAddress);
      if (!label) return e;
      return {
        ...e,
        counterpartyLabel: label.label,
        counterpartyCategory: label.category,
      };
    }),
  }));
  const score = computeRiskScore(flags);
  const scoreBreakdown = computeScoreBreakdown(flags);
  const graph = computeGraph(ctx, flags);

  return {
    address: ctx.address,
    chain,
    scannedAt: new Date().toISOString(),
    riskScore: score,
    scoreBreakdown,
    recommendation: recommendation(score, flags),
    flags,
    graph,
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
