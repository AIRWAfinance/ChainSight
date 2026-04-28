import { EtherscanClient } from '../data/etherscan.js';
import { MemoryCache } from '../cache/memory.js';
import { analyze } from './analyze.js';
import type { RiskReport } from './types.js';

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export class ScanError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'invalid_address'
      | 'missing_api_key'
      | 'upstream_error'
      | 'rate_limited',
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ScanError';
  }
}

export interface RunScanOptions {
  apiKey?: string;
  rateLimitPerSecond?: number;
  cacheTtlSeconds?: number;
}

export async function runScan(
  rawAddress: string,
  opts: RunScanOptions = {},
): Promise<RiskReport> {
  const address = rawAddress.trim();
  if (!ADDRESS_RE.test(address)) {
    throw new ScanError('Invalid Ethereum address', 'invalid_address', 400);
  }

  const apiKey = opts.apiKey ?? process.env['ETHERSCAN_API_KEY'];
  if (!apiKey || apiKey === 'your_etherscan_key_here') {
    throw new ScanError(
      'ETHERSCAN_API_KEY is not configured on the server.',
      'missing_api_key',
      500,
    );
  }

  const cache = new MemoryCache(opts.cacheTtlSeconds ?? 86400);
  const client = new EtherscanClient({
    apiKey,
    rateLimitPerSecond: opts.rateLimitPerSecond ?? 4,
    cache,
  });

  let txs;
  try {
    txs = await client.getAllTransactions(address);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown upstream error';
    if (/rate limit/i.test(msg)) {
      throw new ScanError(msg, 'rate_limited', 429);
    }
    throw new ScanError(msg, 'upstream_error', 502);
  }

  return analyze(address, txs);
}
