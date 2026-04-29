/**
 * Sync EU consolidated financial sanctions (CFSP) — via OpenSanctions.
 *
 * Strategy: the EU's official FSF feed at webgate.ec.europa.eu requires an
 * issued auth token. OpenSanctions (https://www.opensanctions.org) ingests
 * the EU FSF daily under the `eu_fsf` dataset and republishes it with no
 * auth required, in machine-readable JSON Lines (FollowTheMoney schema).
 *
 * Source: https://www.opensanctions.org/datasets/eu_fsf/
 *
 * Each FollowTheMoney entity may carry a `cryptoWallets` property (array of
 * strings like "0xabc..." or "ETH:0xabc..."). We scan every entity for any
 * value that matches the EVM address regex and emit one record per unique
 * address.
 *
 * Usage: npm run sync:eu
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const OPEN_SANCTIONS_EU_FSF_URL =
  'https://data.opensanctions.org/datasets/latest/eu_fsf/entities.ftm.json';

const OUTPUT_PATH = resolve(
  process.cwd(),
  'data/sanctions/eu-consolidated.json',
);

const ETH_ADDRESS_REGEX = /0x[a-fA-F0-9]{40}/g;

interface SanctionedRecord {
  address: string;
  list: 'EU_CFSP';
  entity?: string;
  program?: string;
  source: {
    source: string;
    url: string;
    retrievedAt: string;
    reference: string;
  };
}

interface FtmEntity {
  id: string;
  schema: string;
  properties?: Record<string, unknown>;
}

async function fetchNdjson(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'ChainSight/0.7 (https://github.com/AIRWAfinance/ChainSight)' },
  });
  if (!res.ok) {
    throw new Error(`OpenSanctions EU FSF fetch failed: HTTP ${res.status}`);
  }
  return await res.text();
}

function flattenStrings(val: unknown, out: string[]): void {
  if (val == null) return;
  if (typeof val === 'string') {
    out.push(val);
    return;
  }
  if (Array.isArray(val)) {
    for (const v of val) flattenStrings(v, out);
    return;
  }
  if (typeof val === 'object') {
    for (const v of Object.values(val as Record<string, unknown>)) {
      flattenStrings(v, out);
    }
  }
}

function extract(ndjson: string): SanctionedRecord[] {
  const today = new Date().toISOString();
  const seen = new Map<string, SanctionedRecord>();

  for (const line of ndjson.split('\n')) {
    if (!line.trim()) continue;
    let entity: FtmEntity;
    try {
      entity = JSON.parse(line) as FtmEntity;
    } catch {
      continue;
    }

    // Collect every string value from this entity's properties so we catch
    // crypto addresses that live under cryptoWallets, notes, sourceUrl, etc.
    const strings: string[] = [];
    flattenStrings(entity.properties, strings);

    const haystack = strings.join(' ');
    const matches = haystack.match(ETH_ADDRESS_REGEX) ?? [];

    if (matches.length === 0) continue;

    const props = (entity.properties ?? {}) as Record<string, unknown>;
    const nameVal = (props['name'] as string[] | undefined)?.[0];
    const programVal = (props['program'] as string[] | undefined)?.[0];

    for (const raw of matches) {
      const address = raw.toLowerCase();
      if (seen.has(address)) continue;
      seen.set(address, {
        address,
        list: 'EU_CFSP',
        entity: nameVal,
        program: programVal,
        source: {
          source:
            'EU Council, Consolidated Financial Sanctions List (CFSP) — via OpenSanctions',
          url: 'https://www.opensanctions.org/datasets/eu_fsf/',
          retrievedAt: today,
          reference: `OpenSanctions entity ${entity.id}`,
        },
      });
    }
  }

  return [...seen.values()];
}

async function main(): Promise<void> {
  console.log(
    `[sync-eu] Fetching EU FSF via OpenSanctions: ${OPEN_SANCTIONS_EU_FSF_URL}`,
  );
  let records: SanctionedRecord[] = [];
  let fetchOk = false;
  try {
    const ndjson = await fetchNdjson(OPEN_SANCTIONS_EU_FSF_URL);
    records = extract(ndjson);
    fetchOk = true;
  } catch (err) {
    console.warn(`[sync-eu] WARN: ${(err as Error).message}`);
    console.warn(
      `[sync-eu] Writing empty list. Verify OpenSanctions endpoint or add a fallback mirror.`,
    );
  }

  console.log(
    `[sync-eu] Extracted ${records.length} unique ETH-format addresses`,
  );

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  const lastSyncedAt = new Date().toISOString();
  writeFileSync(
    OUTPUT_PATH,
    JSON.stringify(
      {
        list: 'EU_CFSP',
        lastSyncedAt,
        lastSyncOk: fetchOk,
        count: records.length,
        source: OPEN_SANCTIONS_EU_FSF_URL,
        addresses: records,
      },
      null,
      2,
    ),
  );
  console.log(`[sync-eu] Wrote ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('[sync-eu] FAILED:', err);
  process.exit(1);
});
