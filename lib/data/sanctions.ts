import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Citation } from '../engine/types.js';

export type SanctionsList = 'OFAC_SDN' | 'EU_CFSP' | 'UK_HMT' | 'UN_SC';

export interface SanctionedAddress {
  address: string;
  list: SanctionsList;
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

let cached: Map<string, SanctionedAddress> | null = null;

export function loadSanctionsList(): Map<string, SanctionedAddress> {
  if (cached) return cached;

  const merged = new Map<string, SanctionedAddress>();

  for (const { file } of SOURCE_PATHS) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) continue;

    let raw;
    try {
      raw = JSON.parse(readFileSync(path, 'utf-8')) as
        | SanctionedAddress[]
        | { addresses: SanctionedAddress[] };
    } catch {
      continue;
    }

    const list = Array.isArray(raw) ? raw : raw.addresses;
    for (const entry of list) {
      const key = entry.address.toLowerCase();
      // First match wins (preserves OFAC over EU when both list the same address)
      if (!merged.has(key)) {
        merged.set(key, entry);
      }
    }
  }

  cached = merged;
  return cached;
}

export function isSanctioned(address: string): SanctionedAddress | null {
  const list = loadSanctionsList();
  return list.get(address.toLowerCase()) ?? null;
}

export function clearSanctionsCache(): void {
  cached = null;
}
