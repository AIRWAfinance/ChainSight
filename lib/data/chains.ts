/**
 * Chain registry — maps a slug to Etherscan V2 multichain config.
 *
 * Etherscan V2 API: https://docs.etherscan.io/v2-migration
 * Single API key works across all supported chains via `chainid` param.
 */

export type ChainSlug =
  | 'ethereum'
  | 'polygon'
  | 'bsc'
  | 'arbitrum'
  | 'base'
  | 'optimism';

export interface ChainConfig {
  slug: ChainSlug;
  name: string;
  chainId: number;
  nativeSymbol: string;
  nativeDecimals: number;
  explorerName: string;
}

export const CHAINS: Record<ChainSlug, ChainConfig> = {
  ethereum: {
    slug: 'ethereum',
    name: 'Ethereum',
    chainId: 1,
    nativeSymbol: 'ETH',
    nativeDecimals: 18,
    explorerName: 'Etherscan',
  },
  polygon: {
    slug: 'polygon',
    name: 'Polygon',
    chainId: 137,
    nativeSymbol: 'POL',
    nativeDecimals: 18,
    explorerName: 'PolygonScan',
  },
  bsc: {
    slug: 'bsc',
    name: 'BNB Smart Chain',
    chainId: 56,
    nativeSymbol: 'BNB',
    nativeDecimals: 18,
    explorerName: 'BscScan',
  },
  arbitrum: {
    slug: 'arbitrum',
    name: 'Arbitrum',
    chainId: 42161,
    nativeSymbol: 'ETH',
    nativeDecimals: 18,
    explorerName: 'Arbiscan',
  },
  base: {
    slug: 'base',
    name: 'Base',
    chainId: 8453,
    nativeSymbol: 'ETH',
    nativeDecimals: 18,
    explorerName: 'BaseScan',
  },
  optimism: {
    slug: 'optimism',
    name: 'Optimism',
    chainId: 10,
    nativeSymbol: 'ETH',
    nativeDecimals: 18,
    explorerName: 'Optimistic Etherscan',
  },
};

export const SUPPORTED_CHAINS: ChainSlug[] = Object.keys(CHAINS) as ChainSlug[];

export function isChainSlug(s: string): s is ChainSlug {
  return s in CHAINS;
}

export function chainConfig(slug: ChainSlug): ChainConfig {
  return CHAINS[slug];
}
