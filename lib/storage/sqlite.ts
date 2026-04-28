import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { ChainSlug, RiskReport } from '../engine/types.js';
import type {
  SavedScan,
  SavedScanSummary,
  ScanStore,
  WatchlistEntry,
  WatchlistStore,
} from './types.js';

interface ScanRow {
  id: string;
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
  address: string;
  chain: string;
  alert_email: string | null;
  added_at: string;
  last_checked_at: string | null;
  last_seen_score: number | null;
  status: string;
}

export class SqliteStorage implements ScanStore, WatchlistStore {
  private db: Database.Database;

  constructor(dbPath: string) {
    mkdirSync(dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.init();
  }

  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS scans (
        id TEXT PRIMARY KEY,
        address TEXT NOT NULL,
        chain TEXT NOT NULL,
        risk_score INTEGER NOT NULL,
        recommendation TEXT NOT NULL,
        scanned_at TEXT NOT NULL,
        flags_count INTEGER NOT NULL,
        report_json TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_scans_scanned_at ON scans(scanned_at);
      CREATE INDEX IF NOT EXISTS idx_scans_address ON scans(address, chain);

      CREATE TABLE IF NOT EXISTS watchlist (
        id TEXT PRIMARY KEY,
        address TEXT NOT NULL,
        chain TEXT NOT NULL,
        alert_email TEXT,
        added_at TEXT NOT NULL,
        last_checked_at TEXT,
        last_seen_score INTEGER,
        status TEXT NOT NULL DEFAULT 'active',
        UNIQUE(address, chain)
      );
    `);
  }

  // -----------------------------
  // ScanStore
  // -----------------------------

  saveScan(report: RiskReport): SavedScanSummary {
    const id = randomUUID();
    this.db
      .prepare(
        `INSERT INTO scans
         (id, address, chain, risk_score, recommendation, scanned_at, flags_count, report_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
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
      address: report.address,
      chain: report.chain,
      riskScore: report.riskScore,
      recommendation: report.recommendation,
      scannedAt: report.scannedAt,
      flagsCount: report.flags.length,
    };
  }

  getScan(id: string): SavedScan | null {
    const row = this.db
      .prepare('SELECT * FROM scans WHERE id = ?')
      .get(id) as ScanRow | undefined;
    if (!row) return null;
    return {
      id: row.id,
      address: row.address,
      chain: row.chain as ChainSlug,
      riskScore: row.risk_score,
      recommendation: row.recommendation,
      scannedAt: row.scanned_at,
      flagsCount: row.flags_count,
      report: JSON.parse(row.report_json) as RiskReport,
    };
  }

  listScans(limit: number = 50): SavedScanSummary[] {
    const rows = this.db
      .prepare(
        `SELECT id, address, chain, risk_score, recommendation, scanned_at, flags_count
         FROM scans
         ORDER BY scanned_at DESC
         LIMIT ?`,
      )
      .all(limit) as Array<Omit<ScanRow, 'report_json'>>;

    return rows.map((row) => ({
      id: row.id,
      address: row.address,
      chain: row.chain as ChainSlug,
      riskScore: row.risk_score,
      recommendation: row.recommendation,
      scannedAt: row.scanned_at,
      flagsCount: row.flags_count,
    }));
  }

  deleteScan(id: string): boolean {
    const info = this.db.prepare('DELETE FROM scans WHERE id = ?').run(id);
    return info.changes > 0;
  }

  // -----------------------------
  // WatchlistStore
  // -----------------------------

  add(entry: {
    address: string;
    chain: ChainSlug;
    alertEmail?: string | null;
  }): WatchlistEntry {
    const id = randomUUID();
    const addedAt = new Date().toISOString();
    try {
      this.db
        .prepare(
          `INSERT INTO watchlist
           (id, address, chain, alert_email, added_at, status)
           VALUES (?, ?, ?, ?, ?, 'active')`,
        )
        .run(id, entry.address.toLowerCase(), entry.chain, entry.alertEmail ?? null, addedAt);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (/UNIQUE constraint/i.test(msg)) {
        const existing = this.db
          .prepare('SELECT * FROM watchlist WHERE address = ? AND chain = ?')
          .get(entry.address.toLowerCase(), entry.chain) as WatchRow | undefined;
        if (existing) return rowToWatch(existing);
      }
      throw err;
    }

    return {
      id,
      address: entry.address.toLowerCase(),
      chain: entry.chain,
      alertEmail: entry.alertEmail ?? null,
      addedAt,
      lastCheckedAt: null,
      lastSeenScore: null,
      status: 'active',
    };
  }

  remove(id: string): boolean {
    const info = this.db.prepare('DELETE FROM watchlist WHERE id = ?').run(id);
    return info.changes > 0;
  }

  list(): WatchlistEntry[] {
    const rows = this.db
      .prepare('SELECT * FROM watchlist ORDER BY added_at DESC')
      .all() as WatchRow[];
    return rows.map(rowToWatch);
  }

  get(id: string): WatchlistEntry | null {
    const row = this.db
      .prepare('SELECT * FROM watchlist WHERE id = ?')
      .get(id) as WatchRow | undefined;
    return row ? rowToWatch(row) : null;
  }

  recordCheck(id: string, score: number): WatchlistEntry | null {
    const now = new Date().toISOString();
    const info = this.db
      .prepare(
        `UPDATE watchlist
         SET last_checked_at = ?, last_seen_score = ?
         WHERE id = ?`,
      )
      .run(now, score, id);
    if (info.changes === 0) return null;
    return this.get(id);
  }

  close(): void {
    this.db.close();
  }
}

function rowToWatch(row: WatchRow): WatchlistEntry {
  return {
    id: row.id,
    address: row.address,
    chain: row.chain as ChainSlug,
    alertEmail: row.alert_email,
    addedAt: row.added_at,
    lastCheckedAt: row.last_checked_at,
    lastSeenScore: row.last_seen_score,
    status: (row.status as 'active' | 'paused') ?? 'active',
  };
}
