import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
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

interface AuditRow {
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

interface UserDbRow {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
}

interface ScanRow {
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

interface WatchRow {
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

export class SqliteStorage implements StorageBackend {
  private db: Database.Database;

  constructor(dbPath: string) {
    mkdirSync(dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.init();
  }

  private init(): void {
    this.migrateLegacyTablesIfNeeded();
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS scans (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        address TEXT NOT NULL,
        chain TEXT NOT NULL,
        risk_score INTEGER NOT NULL,
        recommendation TEXT NOT NULL,
        scanned_at TEXT NOT NULL,
        flags_count INTEGER NOT NULL,
        report_json TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_scans_user_scanned ON scans(user_id, scanned_at);

      CREATE TABLE IF NOT EXISTS watchlist (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        address TEXT NOT NULL,
        chain TEXT NOT NULL,
        alert_email TEXT,
        added_at TEXT NOT NULL,
        last_checked_at TEXT,
        last_seen_score INTEGER,
        status TEXT NOT NULL DEFAULT 'active',
        UNIQUE(user_id, address, chain),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
      CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit_events(ts);
      CREATE INDEX IF NOT EXISTS idx_audit_user_ts ON audit_events(actor_user_id, ts);
      CREATE INDEX IF NOT EXISTS idx_audit_action_ts ON audit_events(action, ts);
    `);
  }

  private migrateLegacyTablesIfNeeded(): void {
    const cols = this.db
      .prepare(`PRAGMA table_info(scans)`)
      .all() as Array<{ name: string }>;
    if (cols.length > 0 && !cols.some((c) => c.name === 'user_id')) {
      this.db.exec('DROP TABLE IF EXISTS scans');
      this.db.exec('DROP TABLE IF EXISTS watchlist');
    }
  }

  async createUser(email: string, passwordHash: string): Promise<UserRow> {
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)`,
      )
      .run(id, email, passwordHash, createdAt);
    return { id, email, createdAt };
  }

  async findUserByEmail(
    email: string,
  ): Promise<{ user: UserRow; passwordHash: string } | null> {
    const row = this.db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email) as UserDbRow | undefined;
    if (!row) return null;
    return {
      user: { id: row.id, email: row.email, createdAt: row.created_at },
      passwordHash: row.password_hash,
    };
  }

  async findUserById(id: string): Promise<UserRow | null> {
    const row = this.db
      .prepare('SELECT id, email, created_at FROM users WHERE id = ?')
      .get(id) as Pick<UserDbRow, 'id' | 'email' | 'created_at'> | undefined;
    if (!row) return null;
    return { id: row.id, email: row.email, createdAt: row.created_at };
  }

  async saveScan(userId: string, report: RiskReport): Promise<SavedScanSummary> {
    const id = randomUUID();
    this.db
      .prepare(
        `INSERT INTO scans
         (id, user_id, address, chain, risk_score, recommendation, scanned_at, flags_count, report_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        userId,
        report.address,
        report.chain,
        report.riskScore,
        report.recommendation,
        report.scannedAt,
        report.flags.length,
        JSON.stringify(report),
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
    const row = this.db
      .prepare('SELECT * FROM scans WHERE id = ? AND user_id = ?')
      .get(id, userId) as ScanRow | undefined;
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
    const rows = this.db
      .prepare(
        `SELECT id, user_id, address, chain, risk_score, recommendation, scanned_at, flags_count
         FROM scans
         WHERE user_id = ?
         ORDER BY scanned_at DESC
         LIMIT ?`,
      )
      .all(userId, limit) as Array<Omit<ScanRow, 'report_json'>>;

    return rows.map((row) => ({
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
    const info = this.db
      .prepare('DELETE FROM scans WHERE id = ? AND user_id = ?')
      .run(id, userId);
    return info.changes > 0;
  }

  async addWatch(
    userId: string,
    entry: { address: string; chain: ChainSlug; alertEmail?: string | null },
  ): Promise<WatchlistEntry> {
    const id = randomUUID();
    const addedAt = new Date().toISOString();
    try {
      this.db
        .prepare(
          `INSERT INTO watchlist
           (id, user_id, address, chain, alert_email, added_at, status)
           VALUES (?, ?, ?, ?, ?, ?, 'active')`,
        )
        .run(
          id,
          userId,
          entry.address.toLowerCase(),
          entry.chain,
          entry.alertEmail ?? null,
          addedAt,
        );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (/UNIQUE constraint/i.test(msg)) {
        const existing = this.db
          .prepare(
            'SELECT * FROM watchlist WHERE user_id = ? AND address = ? AND chain = ?',
          )
          .get(userId, entry.address.toLowerCase(), entry.chain) as
          | WatchRow
          | undefined;
        if (existing) return rowToWatch(existing);
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
    const info = this.db
      .prepare('DELETE FROM watchlist WHERE id = ? AND user_id = ?')
      .run(id, userId);
    return info.changes > 0;
  }

  async listWatch(userId: string): Promise<WatchlistEntry[]> {
    const rows = this.db
      .prepare('SELECT * FROM watchlist WHERE user_id = ? ORDER BY added_at DESC')
      .all(userId) as WatchRow[];
    return rows.map(rowToWatch);
  }

  async getWatch(userId: string, id: string): Promise<WatchlistEntry | null> {
    const row = this.db
      .prepare('SELECT * FROM watchlist WHERE id = ? AND user_id = ?')
      .get(id, userId) as WatchRow | undefined;
    return row ? rowToWatch(row) : null;
  }

  async recordWatchCheck(
    id: string,
    score: number,
  ): Promise<WatchlistEntry | null> {
    const now = new Date().toISOString();
    const info = this.db
      .prepare(
        `UPDATE watchlist
         SET last_checked_at = ?, last_seen_score = ?
         WHERE id = ?`,
      )
      .run(now, score, id);
    if (info.changes === 0) return null;
    const row = this.db
      .prepare('SELECT * FROM watchlist WHERE id = ?')
      .get(id) as WatchRow | undefined;
    return row ? rowToWatch(row) : null;
  }

  async listAllActiveWatch(): Promise<WatchlistEntry[]> {
    const rows = this.db
      .prepare(`SELECT * FROM watchlist WHERE status = 'active'`)
      .all() as WatchRow[];
    return rows.map(rowToWatch);
  }

  async appendAudit(
    event: Omit<AuditEvent, 'id' | 'ts' | 'payloadHash'>,
  ): Promise<AuditEvent> {
    const id = randomUUID();
    const ts = new Date().toISOString();
    const payloadHash = hashPayload(event.payload);
    this.db
      .prepare(
        `INSERT INTO audit_events
         (id, ts, actor_user_id, actor_ip, action, target_type, target_id, payload_json, payload_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        ts,
        event.actorUserId,
        event.actorIp,
        event.action,
        event.targetType,
        event.targetId,
        JSON.stringify(event.payload),
        payloadHash,
      );
    return { id, ts, ...event, payloadHash };
  }

  async listAudit(filter: AuditFilter = {}): Promise<AuditEvent[]> {
    const clauses: string[] = [];
    const params: unknown[] = [];
    if (filter.userId) {
      clauses.push('actor_user_id = ?');
      params.push(filter.userId);
    }
    if (filter.action) {
      clauses.push('action = ?');
      params.push(filter.action);
    }
    if (filter.targetType) {
      clauses.push('target_type = ?');
      params.push(filter.targetType);
    }
    if (filter.fromTs) {
      clauses.push('ts >= ?');
      params.push(filter.fromTs);
    }
    if (filter.toTs) {
      clauses.push('ts <= ?');
      params.push(filter.toTs);
    }
    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    const limit = Math.min(10000, Math.max(1, filter.limit ?? 1000));
    const rows = this.db
      .prepare(
        `SELECT * FROM audit_events ${where} ORDER BY ts DESC LIMIT ?`,
      )
      .all(...params, limit) as AuditRow[];
    return rows.map(rowToAudit);
  }

  close(): void {
    this.db.close();
  }
}

function rowToAudit(row: AuditRow): AuditEvent {
  return {
    id: row.id,
    ts: row.ts,
    actorUserId: row.actor_user_id,
    actorIp: row.actor_ip,
    action: row.action as AuditEvent['action'],
    targetType: row.target_type as AuditEvent['targetType'],
    targetId: row.target_id,
    payload: JSON.parse(row.payload_json) as Record<string, unknown>,
    payloadHash: row.payload_hash,
  };
}

function rowToWatch(row: WatchRow): WatchlistEntry {
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
