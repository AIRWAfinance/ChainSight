import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Citation } from '../engine/types.js';

export type KnownBadCategory = 'mixer' | 'scam' | 'ransomware' | 'darknet';

export interface KnownBadAddress {
  address: string;
  category: KnownBadCategory;
  label: string;
  description?: string;
  source: Citation;
}

const MIXERS_PATH = resolve(process.cwd(), 'data/known-bad/mixers.json');
const SCAMS_PATH = resolve(process.cwd(), 'data/known-bad/scams.json');

let mixerCache: Map<string, KnownBadAddress> | null = null;
let scamCache: Map<string, KnownBadAddress> | null = null;

function loadFile(path: string): KnownBadAddress[] {
  if (!existsSync(path)) return [];
  const raw = JSON.parse(readFileSync(path, 'utf-8')) as
    | KnownBadAddress[]
    | { addresses: KnownBadAddress[] };
  return Array.isArray(raw) ? raw : raw.addresses;
}

export function loadMixers(): Map<string, KnownBadAddress> {
  if (mixerCache) return mixerCache;
  mixerCache = new Map(
    loadFile(MIXERS_PATH).map((a) => [a.address.toLowerCase(), a]),
  );
  return mixerCache;
}

export function loadScams(): Map<string, KnownBadAddress> {
  if (scamCache) return scamCache;
  scamCache = new Map(
    loadFile(SCAMS_PATH).map((a) => [a.address.toLowerCase(), a]),
  );
  return scamCache;
}

export function lookupMixer(address: string): KnownBadAddress | null {
  return loadMixers().get(address.toLowerCase()) ?? null;
}

export function lookupScam(address: string): KnownBadAddress | null {
  return loadScams().get(address.toLowerCase()) ?? null;
}
