import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Citation } from '../engine/types.js';

export interface SanctionedAddress {
  address: string;
  list: 'OFAC_SDN' | 'EU_CFSP' | 'UK_HMT';
  entity?: string;
  program?: string;
  addedDate?: string;
  source: Citation;
}

const SANCTIONS_PATH = resolve(
  process.cwd(),
  'data/sanctions/ofac-sdn.json',
);

let cached: Map<string, SanctionedAddress> | null = null;

export function loadSanctionsList(): Map<string, SanctionedAddress> {
  if (cached) return cached;

  if (!existsSync(SANCTIONS_PATH)) {
    cached = new Map();
    return cached;
  }

  const raw = JSON.parse(readFileSync(SANCTIONS_PATH, 'utf-8')) as
    | SanctionedAddress[]
    | { addresses: SanctionedAddress[] };

  const list = Array.isArray(raw) ? raw : raw.addresses;
  cached = new Map(list.map((s) => [s.address.toLowerCase(), s]));
  return cached;
}

export function isSanctioned(address: string): SanctionedAddress | null {
  const list = loadSanctionsList();
  return list.get(address.toLowerCase()) ?? null;
}
