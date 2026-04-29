/**
 * Sync UK OFSI consolidated sanctions list.
 *
 * Source: HM Treasury OFSI publishes a public consolidated list in CSV/XML/JSON.
 *   https://ofsistorage.blob.core.windows.net/publishlive/2022format/ConList.xml
 *
 * Usage: npm run sync:uk
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const UK_URL =
  'https://ofsistorage.blob.core.windows.net/publishlive/2022format/ConList.xml';

const OUTPUT_PATH = resolve(process.cwd(), 'data/sanctions/uk-ofsi.json');
const ETH_ADDRESS_REGEX = /0x[a-fA-F0-9]{40}/g;

interface Record {
  address: string;
  list: 'UK_HMT';
  source: {
    source: string;
    url: string;
    retrievedAt: string;
    reference: string;
  };
}

async function fetchList(): Promise<string> {
  const res = await fetch(UK_URL);
  if (!res.ok) throw new Error(`UK OFSI fetch failed: HTTP ${res.status}`);
  return await res.text();
}

function extract(xml: string): Record[] {
  const matches = xml.match(ETH_ADDRESS_REGEX) ?? [];
  const unique = Array.from(new Set(matches.map((a) => a.toLowerCase())));
  const today = new Date().toISOString().split('T')[0];

  return unique.map((address) => ({
    address,
    list: 'UK_HMT' as const,
    source: {
      source: 'UK HM Treasury OFSI Consolidated List',
      url: UK_URL,
      retrievedAt: today,
      reference: 'UK OFSI consolidated list',
    },
  }));
}

async function main(): Promise<void> {
  console.log(`[sync-uk] Fetching ${UK_URL}...`);
  let records: Record[] = [];
  let fetchOk = false;
  try {
    const xml = await fetchList();
    records = extract(xml);
    fetchOk = true;
  } catch (err) {
    console.warn(`[sync-uk] WARN: ${(err as Error).message}`);
  }

  console.log(`[sync-uk] Extracted ${records.length} unique ETH-format addresses`);

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  const lastSyncedAt = new Date().toISOString();
  writeFileSync(
    OUTPUT_PATH,
    JSON.stringify(
      {
        list: 'UK_HMT',
        lastSyncedAt,
        lastSyncOk: fetchOk,
        count: records.length,
        source: UK_URL,
        addresses: records,
      },
      null,
      2,
    ),
  );
  console.log(`[sync-uk] Wrote ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('[sync-uk] FAILED:', err);
  process.exit(1);
});
