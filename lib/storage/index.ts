import { resolve } from 'node:path';
import { SqliteStorage } from './sqlite.js';
import { PostgresStorage } from './postgres.js';
import type { StorageBackend } from './types.js';

let instance: StorageBackend | null = null;

/**
 * Detects a serverless / read-only filesystem environment where SQLite
 * cannot work. On Vercel, AWS Lambda, etc. the only writable path is
 * `/tmp` (ephemeral); the bundle root is read-only. Use Postgres there.
 */
function isServerlessEnv(): boolean {
  return Boolean(
    process.env['VERCEL'] ||
      process.env['AWS_LAMBDA_FUNCTION_NAME'] ||
      process.env['NETLIFY'] ||
      process.env['CF_PAGES'],
  );
}

export function getStorageBackend(): StorageBackend {
  if (instance) return instance;

  // Accept the canonical CHAINSIGHT_DB_URL OR Vercel's auto-injected
  // POSTGRES_URL (set automatically when you create a Vercel Postgres or
  // Neon integration in the project's Storage tab).
  const pgUrl =
    process.env['CHAINSIGHT_DB_URL'] || process.env['POSTGRES_URL'];
  if (pgUrl && /^postgres(ql)?:\/\//.test(pgUrl)) {
    instance = new PostgresStorage(pgUrl);
    return instance;
  }

  if (isServerlessEnv()) {
    throw new Error(
      'CHAINSIGHT_DB_URL is not set. Production deployments on serverless ' +
        'platforms (Vercel, Lambda, etc.) require a Postgres connection ' +
        'string — SQLite cannot write to the read-only function bundle. ' +
        'Provision Vercel Postgres / Neon / Supabase and set CHAINSIGHT_DB_URL ' +
        'in Project Settings → Environment Variables, then redeploy.',
    );
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
