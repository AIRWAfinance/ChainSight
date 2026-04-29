import type { ChainSlug, RiskReport } from '../engine/types.js';
import type { AuditEvent, AuditFilter } from '../audit/types.js';

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
  totpEnabled?: boolean;
}

export interface UserTotpState {
  /** Base32 secret (only readable while setup is in progress OR after verify). */
  secret: string | null;
  /** ISO-8601 timestamp of successful verify; null until enrolled. */
  verifiedAt: string | null;
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

  // Audit (append-only — no update, no delete)
  appendAudit(event: Omit<AuditEvent, 'id' | 'ts' | 'payloadHash'>): Promise<AuditEvent>;
  listAudit(filter?: AuditFilter): Promise<AuditEvent[]>;

  // TOTP MFA
  setUserTotpSecret(userId: string, secretBase32: string): Promise<void>;
  getUserTotpState(userId: string): Promise<UserTotpState | null>;
  setUserTotpVerified(userId: string): Promise<void>;
  clearUserTotp(userId: string): Promise<void>;
}
