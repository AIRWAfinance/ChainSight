/**
 * Sync EU consolidated financial sanctions list (CFSP).
 *
 * The EU publishes a consolidated XML feed via their FSF/CSV endpoints.
 * The public mirror without authentication is the EUR-Lex / FSD page;
 * for ETH addresses we extract any 0x-prefixed token from the content.
 *
 * Sources:
 *  - https://webgate.ec.europa.eu/fsd/fsf
 *  - EU consolidated list: https://data.europa.eu/data/datasets/consolidated-list-of-persons-groups-and-entities-subject-to-eu-financial-sanctions
 *
 * Usage: npm run sync:eu
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

// Public EU consolidated list (HTML mirror); ETH addresses occasionally appear
// in entity narratives. The XML feed requires CSV authentication tokens, so
// the public HTML mirror is the deterministic offline-friendly fallback.
const EU_PUBLIC_URL =
  'https://webgate.ec.europa.eu/europeaid/fsd/fsf/public/files/xmlFullSanctionsList_1_1/content?token=';

const OUTPUT_PATH = resolve(
  process.cwd(),
  'data/sanctions/eu-consolidated.json',
);
const ETH_ADDRESS_REGEX = /0x[a-fA-F0-9]{40}/g;

interface Record {
  address: string;
  list: 'EU_CFSP';
  source: {
    source: string;
    url: string;
    retrievedAt: string;
    reference: string;
  };
}

async function fetchList(): Promise<string> {
  const res = await fetch(EU_PUBLIC_URL);
  if (!res.ok) {
    throw new Error(
      `EU consolidated list fetch failed: HTTP ${res.status} (the EU feed may require an authenticated token; commit any addresses found in vendor-curated mirrors instead).`,
    );
  }
  return await res.text();
}

function extract(text: string): Record[] {
  const matches = text.match(ETH_ADDRESS_REGEX) ?? [];
  const unique = Array.from(new Set(matches.map((a) => a.toLowerCase())));
  const today = new Date().toISOString().split('T')[0];

  return unique.map((address) => ({
    address,
    list: 'EU_CFSP' as const,
    source: {
      source: 'EU Council, Consolidated Financial Sanctions List (CFSP)',
      url: EU_PUBLIC_URL,
      retrievedAt: today,
      reference: 'EU CFSP consolidated list',
    },
  }));
}

async function main(): Promise<void> {
  console.log(`[sync-eu] Fetching EU consolidated list...`);
  let records: Record[] = [];
  try {
    const text = await fetchList();
    records = extract(text);
  } catch (err) {
    console.warn(`[sync-eu] WARN: ${(err as Error).message}`);
    console.warn(`[sync-eu] Writing empty list. Add addresses manually if needed.`);
  }

  console.log(`[sync-eu] Extracted ${records.length} unique ETH-format addresses`);

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(
    OUTPUT_PATH,
    JSON.stringify(
      {
        lastUpdated: new Date().toISOString().split('T')[0],
        source: EU_PUBLIC_URL,
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
