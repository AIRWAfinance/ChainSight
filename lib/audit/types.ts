/**
 * Audit-event types for ChainSight.
 *
 * Designed as an append-only trail: the StorageBackend exposes append + list
 * only (no update, no delete). Each event carries a SHA-256 hash of its
 * payload so a regulator can verify an exported event has not been altered
 * since it was written.
 *
 * Regulatory basis: EU AMLR / EBA guidelines on internal controls and audit
 * trail; FATF R.11 record-keeping; FinCEN BSA recordkeeping.
 */

export type AuditAction =
  // Auth
  | 'auth.login.success'
  | 'auth.login.fail'
  | 'auth.login.rate_limited'
  | 'auth.logout'
  | 'auth.register'
  // Scan
  | 'scan.run'
  | 'scan.save'
  | 'scan.delete'
  | 'scan.export_pdf'
  // Watchlist
  | 'watchlist.add'
  | 'watchlist.remove'
  | 'watchlist.rescan'
  // Sanctions
  | 'sanctions.sync'
  | 'sanctions.sync_failed'
  // Admin / system
  | 'audit.export';

export type AuditTargetType =
  | 'user'
  | 'scan'
  | 'watchlist'
  | 'sanctions_list'
  | 'system';

export interface AuditEvent {
  id: string;
  ts: string; // ISO-8601 UTC
  actorUserId: string | null; // null for unauthenticated actions (e.g., failed login)
  actorIp: string | null;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string | null;
  payload: Record<string, unknown>;
  payloadHash: string; // SHA-256 hex of stable-stringified payload
}

export interface AuditFilter {
  userId?: string;
  action?: AuditAction;
  targetType?: AuditTargetType;
  fromTs?: string;
  toTs?: string;
  limit?: number;
}
