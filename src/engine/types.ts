export type Severity = 'low' | 'medium' | 'high' | 'critical';

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
  | 'peel_chain';

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

export interface RiskReport {
  address: string;
  chain: 'ethereum';
  scannedAt: string;
  riskScore: number;
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
