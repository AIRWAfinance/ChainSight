import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

export type EntityCategory =
  | 'cex'
  | 'dex'
  | 'dex_aggregator'
  | 'bridge'
  | 'mixer'
  | 'lending'
  | 'staking'
  | 'nft_marketplace'
  | 'unknown';

export type LabelConfidence = 'verified' | 'community';

export interface EntityLabel {
  address: string;
  label: string;
  category: EntityCategory;
  operator?: string;
  confidence: LabelConfidence;
  chain?: string;
  source?: string;
}

const LABELS_PATH = resolve(process.cwd(), 'data/labels/entities.json');

let cached: Map<string, EntityLabel> | null = null;

export function loadLabels(): Map<string, EntityLabel> {
  if (cached) return cached;

  if (!existsSync(LABELS_PATH)) {
    cached = new Map();
    return cached;
  }

  try {
    const raw = JSON.parse(readFileSync(LABELS_PATH, 'utf-8')) as {
      entities: EntityLabel[];
    };
    cached = new Map(
      (raw.entities ?? []).map((e) => [e.address.toLowerCase(), e]),
    );
  } catch {
    cached = new Map();
  }

  return cached;
}

export function labelFor(address: string | undefined): EntityLabel | null {
  if (!address) return null;
  return loadLabels().get(address.toLowerCase()) ?? null;
}
