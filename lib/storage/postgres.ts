import pg from 'pg';
import { randomUUID } from 'node:crypto';
import type { ChainSlug, RiskReport } from '../engine/types.js';
import type {
  SavedScan,
  SavedScanSummary,
  StorageBackend,
  UserRow,
  WatchlistEntry,
} from './types.js';
import type { AuditEvent, AuditFilter } from '../audit/types.js';
import { hashPayload } from '../audit/hash.js';
import type { UserTotpState, UserRole } from './types.js';

interface AuditDbRow {
  id: string;
  ts: string;
  actor_user_id: string | null;
  actor_ip: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  payload_json: string;
  payload_hash: string;
}

const { Pool } = pg;

interface UserDbRow {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
  totp_secret?: string | null;
  totp_verified_at?: string | null;
  role?: string | null;
}

interface ScanDbRow {
  id: string;
  user_id: string;
  address: string;
  chain: string;
  risk_score: number;
  recommendation: string;
  scanned_at: string;
  flags_count: number;
  report_json: string;
}

interface WatchDbRow {
  id: string;
  user_id: string;
  address: string;
  chain: string;
  alert_email: string | null;
  added_at: string;
  last_checked_at: string | null;
  last_seen_score: number | null;
  status: string;
}

export class PostgresStorage implements StorageBackend {
  private pool: pg.Pool;
  private initPromise: Promise<void>;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString, max: 5 });
    this.initPromise = this.runMigrations();
  }

  private async runMigrations(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL,
        totp_secret TEXT,
        totp_verified_at TEXT
      );
      ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_verified_at TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

      CREATE TABLE IF NOT EXISTS scans (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        address TEXT NOT NULL,
        chain TEXT NOT NULL,
        risk_score INTEGER NOT NULL,
        recommendation TEXT NOT NULL,
        scanned_at TEXT NOT NULL,
        flags_count INTEGER NOT NULL,
        report_json TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_scans_user_scanned ON scans(user_id, scanned_at DESC);

      CREATE TABLE IF NOT EXISTS watchlist (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        address TEXT NOT NULL,
        chain TEXT NOT NULL,
        alert_email TEXT,
        added_at TEXT NOT NULL,
        last_checked_at TEXT,
        last_seen_score INTEGER,
        status TEXT NOT NULL DEFAULT 'active',
        UNIQUE (user_id, address, chain)
      );
      CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id);

      CREATE TABLE IF NOT EXISTS audit_events (
        id TEXT PRIMARY KEY,
        ts TEXT NOT NULL,
        actor_user_id TEXT,
        actor_ip TEXT,
        action TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_id TEXT,
        payload_json TEXT NOT NULL,
        payload_hash TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit_events(ts DESC);
      CREATE INDEX IF NOT EXISTS idx_audit_user_ts ON audit_events(actor_user_id, ts DESC);
      CREATE INDEX IF NOT EXISTS idx_audit_action_ts ON audit_events(action, ts DESC);
    `);
  }

  private async q<T extends pg.QueryResultRow>(
    sql: string,
    params: unknown[] = [],
  ): Promise<pg.QueryResult<T>> {
    await this.initPromise;
    return this.pool.query<T>(sql, params);
  }

  async createUser(email: string, passwordHash: string): Promise<UserRow> {
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    await this.q(
      `INSERT INTO users (id, email, password_hash, created_at, role) VALUES ($1, $2, $3, $4, 'user')`,
      [id, email, passwordHash, createdAt],
    );
    return { id, email, createdAt, role: 'user' };
  }

  async findUserByEmail(
    email: string,
  ): Promise<{ user: UserRow; passwordHash: string } | null> {
    const r = await this.q<UserDbRow>('SELECT * FROM users WHERE email = $1', [
      email,
    ]);
    const row = r.rows[0];
    if (!row) return null;
    return {
      user: {
        id: row.id,
        email: row.email,
        createdAt: row.created_at,
        totpEnabled: Boolean(row.totp_verified_at),
        role: (row.role as UserRole) ?? 'user',
      },
      passwordHash: row.password_hash,
    };
  }

  async findUserById(id: string): Promise<UserRow | null> {
    const r = await this.q<UserDbRow>(
      'SELECT id, email, created_at, password_hash, totp_verified_at, role FROM users WHERE id = $1',
      [id],
    );
    const row = r.rows[0];
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      createdAt: row.created_at,
      totpEnabled: Boolean(row.totp_verified_at),
      role: (row.role as UserRole) ?? 'user',
    };
  }

  async setUserTotpSecret(userId: string, secretBase32: string): Promise<void> {
    await this.q(
      `UPDATE users SET totp_secret = $1, totp_verified_at = NULL WHERE id = $2`,
      [secretBase32, userId],
    );
  }

  async getUserTotpState(userId: string): Promise<UserTotpState | null> {
    const r = await this.q<{
      totp_secret: string | null;
      totp_verified_at: string | null;
    }>('SELECT totp_secret, totp_verified_at FROM users WHERE id = $1', [
      userId,
    ]);
    const row = r.rows[0];
    if (!row) return null;
    return {
      secret: row.totp_secret ?? null,
      verifiedAt: row.totp_verified_at ?? null,
    };
  }

  async setUserTotpVerified(userId: string): Promise<void> {
    const now = new Date().toISOString();
    await this.q(`UPDATE users SET totp_verified_at = $1 WHERE id = $2`, [
      now,
      userId,
    ]);
  }

  async clearUserTotp(userId: string): Promise<void> {
    await this.q(
      `UPDATE users SET totp_secret = NULL, totp_verified_at = NULL WHERE id = $1`,
      [userId],
    );
  }

  async setUserRole(userId: string, role: UserRole): Promise<void> {
    await this.q(`UPDATE users SET role = $1 WHERE id = $2`, [role, userId]);
  }

  async listUsers(limit: number = 200): Promise<UserRow[]> {
    const r = await this.q<{
      id: string;
      email: string;
      created_at: string;
      totp_verified_at: string | null;
      role: string | null;
    }>(
      `SELECT id, email, created_at, totp_verified_at, role
       FROM users ORDER BY created_at DESC LIMIT $1`,
      [limit],
    );
    return r.rows.map((row) => ({
      id: row.id,
      email: row.email,
      createdAt: row.created_at,
      totpEnabled: Boolean(row.totp_verified_at),
      role: (row.role as UserRole) ?? 'user',
    }));
  }

  async countUsers(): Promise<{
    total: number;
    admins: number;
    mfaEnabled: number;
  }> {
    const r = await this.q<{
      total: string;
      admins: string;
      mfa_enabled: string;
    }>(
      `SELECT
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE role = 'admin') AS admins,
         COUNT(*) FILTER (WHERE totp_verified_at IS NOT NULL) AS mfa_enabled
       FROM users`,
    );
    const row = r.rows[0]!;
    return {
      total: Number(row.total),
      admins: Number(row.admins),
      mfaEnabled: Number(row.mfa_enabled),
    };
  }

  async saveScan(userId: string, report: RiskReport): Promise<SavedScanSummary> {
    const id = randomUUID();
    await this.q(
      `INSERT INTO scans (id, user_id, address, chain, risk_score, recommendation, scanned_at, flags_count, report_json)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        id,
        userId,
        report.address,
        report.chain,
        report.riskScore,
        report.recommendation,
        report.scannedAt,
        report.flags.length,
        JSON.stringify(report),
      ],
    );
    return {
      id,
      userId,
      address: report.address,
      chain: report.chain,
      riskScore: report.riskScore,
      recommendation: report.recommendation,
      scannedAt: report.scannedAt,
      flagsCount: report.flags.length,
    };
  }

  async getScan(userId: string, id: string): Promise<SavedScan | null> {
    const r = await this.q<ScanDbRow>(
      'SELECT * FROM scans WHERE id = $1 AND user_id = $2',
      [id, userId],
    );
    const row = r.rows[0];
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      address: row.address,
      chain: row.chain as ChainSlug,
      riskScore: row.risk_score,
      recommendation: row.recommendation,
      scannedAt: row.scanned_at,
      flagsCount: row.flags_count,
      report: JSON.parse(row.report_json) as RiskReport,
    };
  }

  async listScans(
    userId: string,
    limit: number = 50,
  ): Promise<SavedScanSummary[]> {
    const r = await this.q<Omit<ScanDbRow, 'report_json'>>(
      `SELECT id, user_id, address, chain, risk_score, recommendation, scanned_at, flags_count
       FROM scans WHERE user_id = $1 ORDER BY scanned_at DESC LIMIT $2`,
      [userId, limit],
    );
    return r.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      address: row.address,
      chain: row.chain as ChainSlug,
      riskScore: row.risk_score,
      recommendation: row.recommendation,
      scannedAt: row.scanned_at,
      flagsCount: row.flags_count,
    }));
  }

  async deleteScan(userId: string, id: string): Promise<boolean> {
    const r = await this.q('DELETE FROM scans WHERE id = $1 AND user_id = $2', [
      id,
      userId,
    ]);
    return (r.rowCount ?? 0) > 0;
  }

  async addWatch(
    userId: string,
    entry: { address: string; chain: ChainSlug; alertEmail?: string | null },
  ): Promise<WatchlistEntry> {
    const id = randomUUID();
    const addedAt = new Date().toISOString();
    try {
      await this.q(
        `INSERT INTO watchlist (id, user_id, address, chain, alert_email, added_at, status)
         VALUES ($1,$2,$3,$4,$5,$6,'active')`,
        [
          id,
          userId,
          entry.address.toLowerCase(),
          entry.chain,
          entry.alertEmail ?? null,
          addedAt,
        ],
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (/duplicate key|unique constraint/i.test(msg)) {
        const r = await this.q<WatchDbRow>(
          'SELECT * FROM watchlist WHERE user_id = $1 AND address = $2 AND chain = $3',
          [userId, entry.address.toLowerCase(), entry.chain],
        );
        const row = r.rows[0];
        if (row) return rowToWatch(row);
      }
      throw err;
    }
    return {
      id,
      userId,
      address: entry.address.toLowerCase(),
      chain: entry.chain,
      alertEmail: entry.alertEmail ?? null,
      addedAt,
      lastCheckedAt: null,
      lastSeenScore: null,
      status: 'active',
    };
  }

  async removeWatch(userId: string, id: string): Promise<boolean> {
    const r = await this.q('DELETE FROM watchlist WHERE id = $1 AND user_id = $2', [
      id,
      userId,
    ]);
    return (r.rowCount ?? 0) > 0;
  }

  async listWatch(userId: string): Promise<WatchlistEntry[]> {
    const r = await this.q<WatchDbRow>(
      'SELECT * FROM watchlist WHERE user_id = $1 ORDER BY added_at DESC',
      [userId],
    );
    return r.rows.map(rowToWatch);
  }

  async getWatch(userId: string, id: string): Promise<WatchlistEntry | null> {
    const r = await this.q<WatchDbRow>(
      'SELECT * FROM watchlist WHERE id = $1 AND user_id = $2',
      [id, userId],
    );
    return r.rows[0] ? rowToWatch(r.rows[0]) : null;
  }

  async recordWatchCheck(
    id: string,
    score: number,
  ): Promise<WatchlistEntry | null> {
    const now = new Date().toISOString();
    const r = await this.q(
      `UPDATE watchlist SET last_checked_at = $1, last_seen_score = $2 WHERE id = $3`,
      [now, score, id],
    );
    if ((r.rowCount ?? 0) === 0) return null;
    const r2 = await this.q<WatchDbRow>('SELECT * FROM watchlist WHERE id = $1', [id]);
    return r2.rows[0] ? rowToWatch(r2.rows[0]) : null;
  }

  async listAllActiveWatch(): Promise<WatchlistEntry[]> {
    const r = await this.q<WatchDbRow>(
      `SELECT * FROM watchlist WHERE status = 'active'`,
    );
    return r.rows.map(rowToWatch);
  }

  async appendAudit(
    event: Omit<AuditEvent, 'id' | 'ts' | 'payloadHash'>,
  ): Promise<AuditEvent> {
    const id = randomUUID();
    const ts = new Date().toISOString();
    const payloadHash = hashPayload(event.payload);
    await this.q(
      `INSERT INTO audit_events
       (id, ts, actor_user_id, actor_ip, action, target_type, target_id, payload_json, payload_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        id,
        ts,
        event.actorUserId,
        event.actorIp,
        event.action,
        event.targetType,
        event.targetId,
        JSON.stringify(event.payload),
        payloadHash,
      ],
    );
    return { id, ts, ...event, payloadHash };
  }

  async listAudit(filter: AuditFilter = {}): Promise<AuditEvent[]> {
    const clauses: string[] = [];
    const params: unknown[] = [];
    let idx = 1;
    if (filter.userId) {
      clauses.push(`actor_user_id = $${idx++}`);
      params.push(filter.userId);
    }
    if (filter.action) {
      clauses.push(`action = $${idx++}`);
      params.push(filter.action);
    }
    if (filter.targetType) {
      clauses.push(`target_type = $${idx++}`);
      params.push(filter.targetType);
    }
    if (filter.fromTs) {
      clauses.push(`ts >= $${idx++}`);
      params.push(filter.fromTs);
    }
    if (filter.toTs) {
      clauses.push(`ts <= $${idx++}`);
      params.push(filter.toTs);
    }
    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    const limit = Math.min(10000, Math.max(1, filter.limit ?? 1000));
    params.push(limit);
    const r = await this.q<AuditDbRow>(
      `SELECT * FROM audit_events ${where} ORDER BY ts DESC LIMIT $${idx}`,
      params,
    );
    return r.rows.map(rowToAudit);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

function rowToAudit(row: AuditDbRow): AuditEvent {
  return {
    id: row.id,
    ts: row.ts,
    actorUserId: row.actor_user_id,
    actorIp: row.actor_ip,
    action: row.action as AuditEvent['action'],
    targetType: row.target_type as AuditEvent['targetType'],
    targetId: row.target_id,
    payload:
      typeof row.payload_json === 'string'
        ? (JSON.parse(row.payload_json) as Record<string, unknown>)
        : (row.payload_json as Record<string, unknown>),
    payloadHash: row.payload_hash,
  };
}

function rowToWatch(row: WatchDbRow): WatchlistEntry {
  return {
    id: row.id,
    userId: row.user_id,
    address: row.address,
    chain: row.chain as ChainSlug,
    alertEmail: row.alert_email,
    addedAt: row.added_at,
    lastCheckedAt: row.last_checked_at,
    lastSeenScore: row.last_seen_score,
    status: (row.status as 'active' | 'paused') ?? 'active',
  };
}
