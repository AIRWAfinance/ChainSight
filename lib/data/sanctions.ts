import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Citation } from '../engine/types.js';

export type SanctionsList = 'OFAC_SDN' | 'EU_CFSP' | 'UK_HMT' | 'UN_SC';

export interface SanctionedAddress {
  address: string;
  /**
   * Primary list — the first jurisdiction in load order. Kept for backwards
   * compatibility with existing typology consumers. Prefer `lists` for
   * complete jurisdictional coverage.
   */
  list: SanctionsList;
  /**
   * All sanctions lists this address appears on. A regulator inspection
   * needs to see every applicable jurisdiction, not just the first match.
   */
  lists: SanctionsList[];
  entity?: string;
  program?: string;
  addedDate?: string;
  source: Citation;
}

export interface ListFreshness {
  list: SanctionsList;
  lastSyncedAt: string | null;
  ageHours: number | null;
  count: number;
  lastSyncOk: boolean | null;
  isStale: boolean; // true if older than STALE_THRESHOLD_HOURS or never synced
  fileExists: boolean;
}

const STALE_THRESHOLD_HOURS = 24;

interface RawListFile {
  list?: SanctionsList;
  lastSyncedAt?: string;
  lastUpdated?: string;
  lastSyncOk?: boolean;
  count?: number;
  source?: string;
  addresses?: SanctionedRecordRaw[];
}

interface SanctionedRecordRaw {
  address: string;
  list?: SanctionsList;
  entity?: string;
  program?: string;
  addedDate?: string;
  source: Citation;
}

const SOURCE_PATHS: Array<{ list: SanctionsList; file: string }> = [
  { list: 'OFAC_SDN', file: 'data/sanctions/ofac-sdn.json' },
  { list: 'EU_CFSP', file: 'data/sanctions/eu-consolidated.json' },
  { list: 'UK_HMT', file: 'data/sanctions/uk-ofsi.json' },
  { list: 'UN_SC', file: 'data/sanctions/un-sc.json' },
];

let cachedAddresses: Map<string, SanctionedAddress> | null = null;
let cachedFreshness: ListFreshness[] | null = null;

function loadFile(file: string): RawListFile | null {
  const path = resolve(process.cwd(), file);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as RawListFile;
  } catch {
    return null;
  }
}

function inferLastSyncedAt(file: RawListFile, filePath: string): string | null {
  if (file.lastSyncedAt) return file.lastSyncedAt;
  if (file.lastUpdated) {
    // Legacy date-only "lastUpdated" — promote to ISO at midnight UTC.
    return /^\d{4}-\d{2}-\d{2}$/.test(file.lastUpdated)
      ? `${file.lastUpdated}T00:00:00.000Z`
      : null;
  }
  // Fallback: file mtime.
  try {
    return statSync(filePath).mtime.toISOString();
  } catch {
    return null;
  }
}

function ageHoursFrom(iso: string | null): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return (Date.now() - t) / (1000 * 60 * 60);
}

function loadInternal(): {
  addresses: Map<string, SanctionedAddress>;
  freshness: ListFreshness[];
} {
  if (cachedAddresses && cachedFreshness) {
    return { addresses: cachedAddresses, freshness: cachedFreshness };
  }

  const merged = new Map<string, SanctionedAddress>();
  const freshness: ListFreshness[] = [];

  for (const { list, file } of SOURCE_PATHS) {
    const path = resolve(process.cwd(), file);
    const raw = loadFile(file);

    if (!raw) {
      freshness.push({
        list,
        lastSyncedAt: null,
        ageHours: null,
        count: 0,
        lastSyncOk: null,
        isStale: true,
        fileExists: existsSync(path),
      });
      continue;
    }

    const lastSyncedAt = inferLastSyncedAt(raw, path);
    const ageHours = ageHoursFrom(lastSyncedAt);
    const count = raw.addresses?.length ?? 0;
    const lastSyncOk =
      typeof raw.lastSyncOk === 'boolean' ? raw.lastSyncOk : null;
    const isStale =
      ageHours === null ? true : ageHours > STALE_THRESHOLD_HOURS;

    freshness.push({
      list,
      lastSyncedAt,
      ageHours,
      count,
      lastSyncOk,
      isStale,
      fileExists: true,
    });

    for (const entry of raw.addresses ?? []) {
      const key = entry.address.toLowerCase();
      const existing = merged.get(key);
      if (existing) {
        if (!existing.lists.includes(list)) existing.lists.push(list);
      } else {
        merged.set(key, {
          address: key,
          list,
          lists: [list],
          entity: entry.entity,
          program: entry.program,
          addedDate: entry.addedDate,
          source: entry.source,
        });
      }
    }
  }

  cachedAddresses = merged;
  cachedFreshness = freshness;
  return { addresses: merged, freshness };
}

export function loadSanctionsList(): Map<string, SanctionedAddress> {
  return loadInternal().addresses;
}

export function isSanctioned(address: string): SanctionedAddress | null {
  return loadInternal().addresses.get(address.toLowerCase()) ?? null;
}

export function getSanctionsFreshness(): ListFreshness[] {
  return loadInternal().freshness;
}

export function isAnyListStale(): boolean {
  return getSanctionsFreshness().some((f) => f.isStale);
}

export function clearSanctionsCache(): void {
  cachedAddresses = null;
  cachedFreshness = null;
}
