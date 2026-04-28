import { resolve } from 'node:path';
import { SqliteStorage } from './sqlite.js';
import { PostgresStorage } from './postgres.js';
import type { StorageBackend } from './types.js';

let instance: StorageBackend | null = null;

export function getStorageBackend(): StorageBackend {
  if (instance) return instance;

  const pgUrl = process.env['CHAINSIGHT_DB_URL'];
  if (pgUrl && /^postgres(ql)?:\/\//.test(pgUrl)) {
    instance = new PostgresStorage(pgUrl);
    return instance;
  }

  const dbPath =
    process.env['CHAINSIGHT_STORE_PATH'] ??
    resolve(process.cwd(), 'data/storage/chainsight.db');
  instance = new SqliteStorage(dbPath);
  return instance;
}

export type {
  SavedScan,
  SavedScanSummary,
  WatchlistEntry,
  UserRow,
  StorageBackend,
} from './types.js';
