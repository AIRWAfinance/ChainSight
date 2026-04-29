import type {
  AddressContext,
  Flag,
  NormalizedTransaction,
  Severity,
} from '../engine/types.js';

/**
 * Layering detector — multi-window, multi-asset.
 *
 * Detects rapid pass-through of value: an inbound transfer arrives and a
 * matching outbound transfer in the same asset leaves shortly after, in a
 * near-identical amount. A hallmark of money-laundering layering.
 *
 * v0.7 upgrade (closes audit blocker 2.1):
 *   - Three time windows (15m / 1h / 24h) with severity escalation
 *   - ERC-20 support (groups matches per token contract; ETH/native is its
 *     own group)
 *   - Stablecoin-aware critical-tier threshold (100k USDT/USDC notional vs
 *     100 ETH-equiv notional)
 *   - Each outflow consumed at most once (consumed-set semantics — no
 *     double-counting)
 *
 * Regulatory basis:
 *   - FATF Virtual Assets Red Flag Indicators (September 2020) §4.2(a)
 *   - Egmont Group / FATF — placement → layering → integration model
 */

const WINDOWS: Array<{ seconds: number; tier: 'fast' | 'medium' | 'slow'; tierSeverity: Severity }> = [
  { seconds: 15 * 60, tier: 'fast', tierSeverity: 'high' },
  { seconds: 60 * 60, tier: 'medium', tierSeverity: 'medium' },
  { seconds: 24 * 60 * 60, tier: 'slow', tierSeverity: 'low' },
];

const VALUE_TOLERANCE = 0.05; // 5%
const MIN_PASS_THROUGH_NATIVE = 0.01; // 0.01 ETH-equivalent
const MIN_PASS_THROUGH_STABLE = 100; // 100 USDT/USDC equivalent
const MIN_MATCHES_FOR_FLAG = 3;
const CRITICAL_MATCH_THRESHOLD = 25;
const CRITICAL_NOTIONAL_NATIVE = 100; // 100 ETH
const CRITICAL_NOTIONAL_STABLE = 100_000; // 100k USDT/USDC

const STABLECOIN_SYMBOLS = new Set([
  'USDT',
  'USDC',
  'DAI',
  'BUSD',
  'TUSD',
  'USDP',
  'FDUSD',
  'PYUSD',
]);

interface AssetClass {
  /** Stable opaque key — used as map key + for evidence note. */
  key: string;
  /** Human-readable label for evidence text. */
  label: string;
  /** Minimum pass-through amount worth examining. */
  minAmount: number;
  /** Critical-tier notional cutoff. */
  criticalNotional: number;
  /** Asset-class label for evidence note. */
  classLabel: 'native' | 'stablecoin' | 'token';
}

function assetClass(tx: NormalizedTransaction, nativeLabel: string): AssetClass {
  if (tx.kind !== 'erc20') {
    return {
      key: '__native__',
      label: nativeLabel,
      minAmount: MIN_PASS_THROUGH_NATIVE,
      criticalNotional: CRITICAL_NOTIONAL_NATIVE,
      classLabel: 'native',
    };
  }
  const symbol = (tx.tokenSymbol ?? 'TOKEN').toUpperCase();
  const isStable = STABLECOIN_SYMBOLS.has(symbol);
  return {
    key: `erc20:${tx.tokenContract ?? symbol}`,
    label: symbol,
    minAmount: isStable ? MIN_PASS_THROUGH_STABLE : 0.0001,
    criticalNotional: isStable ? CRITICAL_NOTIONAL_STABLE : Infinity,
    classLabel: isStable ? 'stablecoin' : 'token',
  };
}

interface Match {
  inflow: NormalizedTransaction;
  outflow: NormalizedTransaction;
  windowSeconds: number;
  windowTier: 'fast' | 'medium' | 'slow';
}

interface AssetMatches {
  asset: AssetClass;
  matches: Match[];
  totalNotional: number;
}

function findMatchesForAsset(
  ctx: AddressContext,
  asset: AssetClass,
  txsForAsset: NormalizedTransaction[],
): Match[] {
  const inflows = txsForAsset
    .filter(
      (tx) => tx.direction === 'in' && !tx.isError && tx.valueEth >= asset.minAmount,
    )
    .sort((a, b) => a.timestamp - b.timestamp);
  const outflows = txsForAsset
    .filter(
      (tx) =>
        tx.direction === 'out' && !tx.isError && tx.valueEth >= asset.minAmount,
    )
    .sort((a, b) => a.timestamp - b.timestamp);

  const consumed = new Set<string>();
  const matches: Match[] = [];

  // Pre-sort windows shortest first so each inflow gets the tightest match.
  const orderedWindows = [...WINDOWS].sort((a, b) => a.seconds - b.seconds);

  for (const inflow of inflows) {
    let bestMatch: { match: Match; windowSec: number } | null = null;

    for (const window of orderedWindows) {
      const candidate = outflows.find(
        (out) =>
          !consumed.has(out.hash) &&
          out.timestamp > inflow.timestamp &&
          out.timestamp - inflow.timestamp <= window.seconds &&
          Math.abs(out.valueEth - inflow.valueEth) /
            Math.max(inflow.valueEth, 1e-9) <=
            VALUE_TOLERANCE,
      );
      if (candidate) {
        bestMatch = {
          match: {
            inflow,
            outflow: candidate,
            windowSeconds: window.seconds,
            windowTier: window.tier,
          },
          windowSec: window.seconds,
        };
        break; // tightest window wins
      }
    }

    if (bestMatch) {
      matches.push(bestMatch.match);
      consumed.add(bestMatch.match.outflow.hash);
      // Use ctx for parity with previous detector hashing — silences unused warn.
      void ctx;
    }
  }

  void ctx;
  return matches;
}

function severityFor(am: AssetMatches): Severity {
  if (
    am.matches.length >= CRITICAL_MATCH_THRESHOLD ||
    am.totalNotional >= am.asset.criticalNotional
  ) {
    return 'critical';
  }
  // Severity = the highest tier reached across matched windows.
  const hasFast = am.matches.some((m) => m.windowTier === 'fast');
  const hasMedium = am.matches.some((m) => m.windowTier === 'medium');
  if (am.matches.length >= 10 || hasFast) return 'high';
  if (hasMedium) return 'medium';
  return 'low';
}

export function detectLayering(ctx: AddressContext): Flag[] {
  // Group transactions by asset (native vs each ERC-20 contract).
  const groups = new Map<string, { asset: AssetClass; txs: NormalizedTransaction[] }>();
  for (const tx of ctx.transactions) {
    if (tx.kind === 'internal') continue;
    if (tx.direction !== 'in' && tx.direction !== 'out') continue;
    const asset = assetClass(tx, 'ETH');
    const slot = groups.get(asset.key) ?? { asset, txs: [] };
    slot.txs.push(tx);
    groups.set(asset.key, slot);
  }

  const flags: Flag[] = [];

  for (const { asset, txs } of groups.values()) {
    const matches = findMatchesForAsset(ctx, asset, txs);
    if (matches.length < MIN_MATCHES_FOR_FLAG) continue;

    const totalNotional = matches.reduce((s, m) => s + m.inflow.valueEth, 0);
    const am: AssetMatches = { asset, matches, totalNotional };
    const severity = severityFor(am);

    const tierCounts = matches.reduce(
      (acc, m) => {
        acc[m.windowTier] += 1;
        return acc;
      },
      { fast: 0, medium: 0, slow: 0 } as Record<'fast' | 'medium' | 'slow', number>,
    );

    flags.push({
      typology: 'layering',
      severity,
      title: `Layering pattern in ${asset.label}: ${matches.length} pass-through transactions`,
      description: [
        `Detected ${matches.length} instances where inbound ${asset.label} was forwarded out in a near-identical amount (within ${VALUE_TOLERANCE * 100}% tolerance).`,
        `Window distribution — ≤15min: ${tierCounts.fast}, ≤1h: ${tierCounts.medium}, ≤24h: ${tierCounts.slow}.`,
        `Total notional passed through: ${totalNotional.toFixed(4)} ${asset.label}.`,
        `Asset class: ${asset.classLabel}.`,
        `This is a classic layering pattern in the money-laundering process (FATF VA RFI 2020 §4.2(a)).`,
      ].join(' '),
      evidence: matches.flatMap(({ inflow, outflow, windowSeconds }) => [
        {
          txHash: inflow.hash,
          counterpartyAddress: inflow.from,
          blockNumber: inflow.blockNumber,
          timestamp: new Date(inflow.timestamp * 1000).toISOString(),
          amountWei: inflow.valueWei,
          note: `IN ${inflow.valueEth.toFixed(6)} ${asset.label} from ${inflow.from}`,
        },
        {
          txHash: outflow.hash,
          counterpartyAddress: outflow.to,
          blockNumber: outflow.blockNumber,
          timestamp: new Date(outflow.timestamp * 1000).toISOString(),
          amountWei: outflow.valueWei,
          note: `OUT ${outflow.valueEth.toFixed(6)} ${asset.label} to ${outflow.to} (+${outflow.timestamp - inflow.timestamp}s; window=${windowSeconds}s)`,
        },
      ]),
      citations: [
        {
          source: 'FATF — Virtual Assets Red Flag Indicators',
          url: 'https://www.fatf-gafi.org/publications/fatfrecommendations/documents/Virtual-Assets-Red-Flag-Indicators.html',
          reference: 'September 2020, Section 4.2(a)',
        },
      ],
    });
  }

  return flags;
}
