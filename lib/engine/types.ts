export type Severity = 'low' | 'medium' | 'high' | 'critical';

export type ChainSlug =
  | 'ethereum'
  | 'polygon'
  | 'bsc'
  | 'arbitrum'
  | 'base'
  | 'optimism';

export type RiskRecommendation =
  | 'low_risk'
  | 'standard_dd'
  | 'enhanced_dd'
  | 'escalate_to_mlro'
  | 'block_or_offboard';

export type TypologyId =
  | 'sanctions_exposure'
  | 'mixer_exposure'
  | 'scam_exposure'
  | 'layering'
  | 'peel_chain'
  | 'high_risk_counterparty'
  | 'dormant_active';

export interface Citation {
  source: string;
  url?: string;
  retrievedAt?: string;
  reference?: string;
}

export interface Evidence {
  txHash?: string;
  counterpartyAddress?: string;
  blockNumber?: number;
  timestamp?: string;
  amountWei?: string;
  amountUsd?: number;
  note?: string;
}

export interface Flag {
  typology: TypologyId;
  severity: Severity;
  title: string;
  description: string;
  evidence: Evidence[];
  citations: Citation[];
}

export interface ScoreContribution {
  typology: TypologyId;
  points: number;
  cappedAt?: number;
}

export interface RiskReport {
  address: string;
  chain: ChainSlug;
  scannedAt: string;
  riskScore: number;
  scoreBreakdown: ScoreContribution[];
  recommendation: RiskRecommendation;
  flags: Flag[];
  summary: {
    totalTransactions: number;
    firstSeen: string | null;
    lastSeen: string | null;
    distinctCounterparties: number;
  };
  meta: {
    chainsightVersion: string;
    typologiesEvaluated: TypologyId[];
    dataSourcesUsed: string[];
  };
}

export interface NormalizedTransaction {
  hash: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  valueWei: string;
  valueEth: number;
  isError: boolean;
  direction: 'in' | 'out' | 'self';
  kind: 'normal' | 'internal' | 'erc20';
  tokenSymbol?: string;
  tokenContract?: string;
}

export interface AddressContext {
  address: string;
  transactions: NormalizedTransaction[];
  firstSeen: number | null;
  lastSeen: number | null;
  counterparties: Set<string>;
}
