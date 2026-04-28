import type { ChainSlug, RiskReport } from '../engine/types.js';

export interface SavedScan {
  id: string;
  address: string;
  chain: ChainSlug;
  riskScore: number;
  recommendation: string;
  scannedAt: string;
  flagsCount: number;
  report: RiskReport;
}

export interface SavedScanSummary {
  id: string;
  address: string;
  chain: ChainSlug;
  riskScore: number;
  recommendation: string;
  scannedAt: string;
  flagsCount: number;
}

export interface WatchlistEntry {
  id: string;
  address: string;
  chain: ChainSlug;
  alertEmail: string | null;
  addedAt: string;
  lastCheckedAt: string | null;
  lastSeenScore: number | null;
  status: 'active' | 'paused';
}

export interface ScanStore {
  saveScan(report: RiskReport): SavedScanSummary;
  getScan(id: string): SavedScan | null;
  listScans(limit?: number): SavedScanSummary[];
  deleteScan(id: string): boolean;
}

export interface WatchlistStore {
  add(entry: {
    address: string;
    chain: ChainSlug;
    alertEmail?: string | null;
  }): WatchlistEntry;
  remove(id: string): boolean;
  list(): WatchlistEntry[];
  get(id: string): WatchlistEntry | null;
  recordCheck(id: string, score: number): WatchlistEntry | null;
}
