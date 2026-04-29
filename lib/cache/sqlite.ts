import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Cache } from './types.js';

export interface CacheEntry {
  key: string;
  value: string;
  fetchedAt: number;
}

export class SqliteCache implements Cache {
  private db: Database.Database;
  private ttlSeconds: number;

  constructor(dbPath: string, ttlSeconds: number) {
    mkdirSync(dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.ttlSeconds = ttlSeconds;
    this.init();
  }

  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS api_cache (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        fetched_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_api_cache_fetched_at
        ON api_cache(fetched_at);
    `);
  }

  get<T>(key: string): T | null {
    const row = this.db
      .prepare(
        'SELECT value, fetched_at AS fetchedAt FROM api_cache WHERE key = ?',
      )
      .get(key) as { value: string; fetchedAt: number } | undefined;

    if (!row) return null;

    const ageSeconds = (Date.now() - row.fetchedAt) / 1000;
    if (ageSeconds > this.ttlSeconds) return null;

    return JSON.parse(row.value) as T;
  }

  set<T>(key: string, value: T): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO api_cache (key, value, fetched_at)
         VALUES (?, ?, ?)`,
      )
      .run(key, JSON.stringify(value), Date.now());
  }

  clear(): void {
    this.db.exec('DELETE FROM api_cache');
  }

  close(): void {
    this.db.close();
  }
}
