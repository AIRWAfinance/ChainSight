import PQueue from 'p-queue';
import type { NormalizedTransaction } from '../engine/types.js';
import type { Cache } from '../cache/types.js';

const ETHERSCAN_BASE = 'https://api.etherscan.io/v2/api';
const ETHEREUM_MAINNET_CHAIN_ID = '1';

interface EtherscanResponse<T> {
  status: string;
  message: string;
  result: T;
}

interface RawTx {
  hash: string;
  blockNumber: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  isError: string;
  contractAddress?: string;
  tokenSymbol?: string;
}

export interface EtherscanConfig {
  apiKey: string;
  rateLimitPerSecond: number;
  cache: Cache;
}

export class EtherscanClient {
  private queue: PQueue;
  private cache: Cache;
  private apiKey: string;

  constructor(config: EtherscanConfig) {
    this.apiKey = config.apiKey;
    this.cache = config.cache;
    this.queue = new PQueue({
      concurrency: 1,
      interval: 1000,
      intervalCap: config.rateLimitPerSecond,
    });
  }

  private async fetchAction<T>(params: Record<string, string>): Promise<T> {
    const cacheKey = `etherscan:${JSON.stringify(params)}`;
    const cached = this.cache.get<T>(cacheKey);
    if (cached !== null) return cached;

    const result = await this.queue.add(async () => {
      const url = new URL(ETHERSCAN_BASE);
      url.searchParams.set('chainid', ETHEREUM_MAINNET_CHAIN_ID);
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v);
      }
      url.searchParams.set('apikey', this.apiKey);

      const res = await fetch(url.toString());
      if (!res.ok) {
        throw new Error(`Etherscan HTTP ${res.status}: ${res.statusText}`);
      }
      const json = (await res.json()) as EtherscanResponse<T>;
      if (json.status !== '1' && json.message !== 'No transactions found') {
        const detail =
          typeof json.result === 'string' ? json.result : JSON.stringify(json.result);
        throw new Error(`Etherscan error: ${json.message} — ${detail}`);
      }
      return (json.status === '1' ? json.result : ([] as unknown as T));
    });

    this.cache.set(cacheKey, result);
    return result as T;
  }

  async getNormalTransactions(address: string): Promise<NormalizedTransaction[]> {
    const raw = await this.fetchAction<RawTx[]>({
      module: 'account',
      action: 'txlist',
      address,
      startblock: '0',
      endblock: '99999999',
      sort: 'asc',
    });
    return raw.map((tx) => normalize(tx, address, 'normal'));
  }

  async getInternalTransactions(address: string): Promise<NormalizedTransaction[]> {
    const raw = await this.fetchAction<RawTx[]>({
      module: 'account',
      action: 'txlistinternal',
      address,
      startblock: '0',
      endblock: '99999999',
      sort: 'asc',
    });
    return raw.map((tx) => normalize(tx, address, 'internal'));
  }

  async getErc20Transactions(address: string): Promise<NormalizedTransaction[]> {
    const raw = await this.fetchAction<RawTx[]>({
      module: 'account',
      action: 'tokentx',
      address,
      startblock: '0',
      endblock: '99999999',
      sort: 'asc',
    });
    return raw.map((tx) => normalize(tx, address, 'erc20'));
  }

  async getAllTransactions(address: string): Promise<NormalizedTransaction[]> {
    const [normal, internal, erc20] = await Promise.all([
      this.getNormalTransactions(address),
      this.getInternalTransactions(address),
      this.getErc20Transactions(address),
    ]);
    return [...normal, ...internal, ...erc20].sort(
      (a, b) => a.timestamp - b.timestamp,
    );
  }
}

function normalize(
  tx: RawTx,
  address: string,
  kind: 'normal' | 'internal' | 'erc20',
): NormalizedTransaction {
  const lowerAddr = address.toLowerCase();
  const from = tx.from.toLowerCase();
  const to = (tx.to || '').toLowerCase();
  const direction: 'in' | 'out' | 'self' =
    from === lowerAddr && to === lowerAddr
      ? 'self'
      : from === lowerAddr
        ? 'out'
        : 'in';

  const valueWei = tx.value;
  const valueEth = Number(BigInt(valueWei || '0')) / 1e18;

  return {
    hash: tx.hash,
    blockNumber: Number(tx.blockNumber),
    timestamp: Number(tx.timeStamp),
    from,
    to,
    valueWei,
    valueEth,
    isError: tx.isError === '1',
    direction,
    kind,
    tokenSymbol: tx.tokenSymbol,
    tokenContract: tx.contractAddress,
  };
}
