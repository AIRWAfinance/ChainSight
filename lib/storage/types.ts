import type { ChainSlug, RiskReport } from '../engine/types.js';

export interface SavedScan {
  id: string;
  userId: string;
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
  userId: string;
  address: string;
  chain: ChainSlug;
  riskScore: number;
  recommendation: string;
  scannedAt: string;
  flagsCount: number;
}

export interface WatchlistEntry {
  id: string;
  userId: string;
  address: string;
  chain: ChainSlug;
  alertEmail: string | null;
  addedAt: string;
  lastCheckedAt: string | null;
  lastSeenScore: number | null;
  status: 'active' | 'paused';
}

export interface UserRow {
  id: string;
  email: string;
  createdAt: string;
}

export interface StorageBackend {
  // Users
  createUser(email: string, passwordHash: string): Promise<UserRow>;
  findUserByEmail(
    email: string,
  ): Promise<{ user: UserRow; passwordHash: string } | null>;
  findUserById(id: string): Promise<UserRow | null>;

  // Scans
  saveScan(userId: string, report: RiskReport): Promise<SavedScanSummary>;
  getScan(userId: string, id: string): Promise<SavedScan | null>;
  listScans(userId: string, limit?: number): Promise<SavedScanSummary[]>;
  deleteScan(userId: string, id: string): Promise<boolean>;

  // Watchlist
  addWatch(
    userId: string,
    entry: { address: string; chain: ChainSlug; alertEmail?: string | null },
  ): Promise<WatchlistEntry>;
  removeWatch(userId: string, id: string): Promise<boolean>;
  listWatch(userId: string): Promise<WatchlistEntry[]>;
  getWatch(userId: string, id: string): Promise<WatchlistEntry | null>;
  recordWatchCheck(id: string, score: number): Promise<WatchlistEntry | null>;
  listAllActiveWatch(): Promise<WatchlistEntry[]>;
}
