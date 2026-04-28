import type { NormalizedTransaction } from '../src/engine/types.js';

export const SUBJECT = '0x1111111111111111111111111111111111111111';
export const TORNADO_ROUTER = '0x8589427373D6D84E98730D7795D8f6f8731FDA16';
export const RANDOM_PEER_A = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
export const RANDOM_PEER_B = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
export const RANDOM_PEER_C = '0xcccccccccccccccccccccccccccccccccccccccc';
export const RANDOM_PEER_D = '0xdddddddddddddddddddddddddddddddddddddddd';
export const RANDOM_PEER_E = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

let blockCounter = 1_000_000;
let hashCounter = 1;

function nextHash(): string {
  hashCounter += 1;
  return `0x${hashCounter.toString(16).padStart(64, '0')}`;
}

export function makeTx(opts: Partial<NormalizedTransaction>): NormalizedTransaction {
  blockCounter += 1;
  return {
    hash: nextHash(),
    blockNumber: opts.blockNumber ?? blockCounter,
    timestamp: opts.timestamp ?? 1_700_000_000,
    from: (opts.from ?? RANDOM_PEER_A).toLowerCase(),
    to: (opts.to ?? SUBJECT).toLowerCase(),
    valueWei: opts.valueWei ?? '1000000000000000000',
    valueEth: opts.valueEth ?? 1,
    isError: opts.isError ?? false,
    direction: opts.direction ?? 'in',
    kind: opts.kind ?? 'normal',
    tokenSymbol: opts.tokenSymbol,
    tokenContract: opts.tokenContract,
  };
}

export function resetCounters(): void {
  blockCounter = 1_000_000;
  hashCounter = 1;
}
