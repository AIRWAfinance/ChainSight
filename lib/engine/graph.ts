import type {
  AddressContext,
  CounterpartyGraph,
  Flag,
  GraphEdge,
  GraphNode,
} from './types.js';
import { labelFor } from '../data/labels.js';

const TOP_N_COUNTERPARTIES = 30;

interface PeerStats {
  address: string;
  totalIn: number;
  totalOut: number;
  txCount: number;
}

/**
 * Compute a 1-hop counterparty graph for the subject address.
 *
 * Aggregates value flow per counterparty, takes the top N by combined volume,
 * and emits nodes (subject + peers) and weighted directional edges.
 */
export function computeGraph(
  ctx: AddressContext,
  flags: Flag[],
): CounterpartyGraph {
  const stats = new Map<string, PeerStats>();
  const subject = ctx.address.toLowerCase();

  for (const tx of ctx.transactions) {
    if (tx.isError) continue;
    const peer = tx.direction === 'out' ? tx.to : tx.from;
    if (!peer || peer === subject) continue;

    const cur = stats.get(peer) ?? {
      address: peer,
      totalIn: 0,
      totalOut: 0,
      txCount: 0,
    };
    // ERC-20 transfers have token-decimals semantics, not chain native
    // decimals — exclude them from the native-value totals to avoid
    // inflated numbers. The tx still counts toward txCount.
    if (tx.kind !== 'erc20') {
      if (tx.direction === 'in') cur.totalIn += tx.valueEth;
      else if (tx.direction === 'out') cur.totalOut += tx.valueEth;
    }
    cur.txCount += 1;
    stats.set(peer, cur);
  }

  // Build set of flagged counterparty addresses for visual emphasis
  const flaggedAddrs = new Set<string>();
  for (const flag of flags) {
    for (const ev of flag.evidence) {
      if (ev.counterpartyAddress) {
        flaggedAddrs.add(ev.counterpartyAddress.toLowerCase());
      }
    }
  }

  // Sort by combined absolute volume, take top N
  const sorted = [...stats.values()].sort(
    (a, b) =>
      Math.max(b.totalIn, b.totalOut) - Math.max(a.totalIn, a.totalOut),
  );
  const top = sorted.slice(0, TOP_N_COUNTERPARTIES);

  // Subject totals
  let subjectIn = 0;
  let subjectOut = 0;
  for (const p of stats.values()) {
    subjectIn += p.totalIn;
    subjectOut += p.totalOut;
  }

  const subjectLabel = labelFor(subject);
  const subjectNode: GraphNode = {
    id: subject,
    label: subjectLabel?.label ?? 'Subject',
    category: 'subject',
    totalIn: round4(subjectIn),
    totalOut: round4(subjectOut),
    txCount: ctx.transactions.length,
    isSubject: true,
  };

  const peerNodes: GraphNode[] = top.map((p) => {
    const lbl = labelFor(p.address);
    return {
      id: p.address,
      label: lbl?.label,
      category: lbl?.category ?? 'unknown',
      totalIn: round4(p.totalIn),
      totalOut: round4(p.totalOut),
      txCount: p.txCount,
      isFlagged: flaggedAddrs.has(p.address),
    };
  });

  const edges: GraphEdge[] = [];
  for (const p of top) {
    if (p.totalIn > 0) {
      edges.push({
        source: p.address,
        target: subject,
        value: round4(p.totalIn),
        txCount: p.txCount,
      });
    }
    if (p.totalOut > 0) {
      edges.push({
        source: subject,
        target: p.address,
        value: round4(p.totalOut),
        txCount: p.txCount,
      });
    }
  }

  return {
    nodes: [subjectNode, ...peerNodes],
    edges,
    truncatedAt: stats.size > TOP_N_COUNTERPARTIES ? TOP_N_COUNTERPARTIES : stats.size,
  };
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
