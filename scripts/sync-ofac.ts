/**
 * Sync OFAC SDN crypto-address list from the live Treasury feed.
 *
 * Source: https://www.treasury.gov/ofac/downloads/sdn.xml
 * Documentation: https://ofac.treasury.gov/specially-designated-nationals-and-blocked-persons-list-sdn-human-readable-lists
 *
 * Usage: npm run sync:ofac
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const SDN_URL = 'https://www.treasury.gov/ofac/downloads/sdn.xml';
const OUTPUT_PATH = resolve(process.cwd(), 'data/sanctions/ofac-sdn.json');

const ETH_ADDRESS_REGEX = /0x[a-fA-F0-9]{40}/g;

interface SanctionedRecord {
  address: string;
  list: 'OFAC_SDN';
  entity?: string;
  program?: string;
  addedDate?: string;
  source: {
    source: string;
    url: string;
    retrievedAt: string;
    reference: string;
  };
}

async function fetchSDN(): Promise<string> {
  const res = await fetch(SDN_URL);
  if (!res.ok) {
    throw new Error(`OFAC SDN fetch failed: HTTP ${res.status}`);
  }
  return await res.text();
}

function extractEthAddresses(xml: string): SanctionedRecord[] {
  const matches = xml.match(ETH_ADDRESS_REGEX) ?? [];
  const unique = Array.from(new Set(matches.map((a) => a.toLowerCase())));
  const today = new Date().toISOString().split('T')[0];

  return unique.map((address) => ({
    address,
    list: 'OFAC_SDN' as const,
    source: {
      source: 'U.S. Department of the Treasury, OFAC SDN List',
      url: SDN_URL,
      retrievedAt: today,
      reference: 'OFAC SDN XML feed',
    },
  }));
}

async function main(): Promise<void> {
  console.log(`[sync-ofac] Fetching ${SDN_URL}...`);
  const xml = await fetchSDN();
  const records = extractEthAddresses(xml);
  console.log(`[sync-ofac] Extracted ${records.length} unique ETH-format addresses`);

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(
    OUTPUT_PATH,
    JSON.stringify(
      {
        lastUpdated: new Date().toISOString().split('T')[0],
        source: SDN_URL,
        addresses: records,
      },
      null,
      2,
    ),
  );
  console.log(`[sync-ofac] Wrote ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('[sync-ofac] FAILED:', err);
  process.exit(1);
});
