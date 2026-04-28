import { resolve } from 'node:path';
import { SqliteStorage } from './sqlite.js';
import type { ScanStore, WatchlistStore } from './types.js';

let instance: SqliteStorage | null = null;

function getStorage(): SqliteStorage {
  if (instance) return instance;
  const dbPath =
    process.env['CHAINSIGHT_STORE_PATH'] ??
    resolve(process.cwd(), 'data/storage/chainsight.db');
  instance = new SqliteStorage(dbPath);
  return instance;
}

export function getScanStore(): ScanStore {
  return getStorage();
}

export function getWatchlistStore(): WatchlistStore {
  return getStorage();
}

export type { SavedScan, SavedScanSummary, WatchlistEntry } from './types.js';
