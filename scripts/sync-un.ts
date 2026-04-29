/**
 * Sync UN Security Council consolidated sanctions list.
 *
 * Source: https://scsanctions.un.org/resources/xml/en/consolidated.xml
 * Documentation: https://main.un.org/securitycouncil/en/content/un-sc-consolidated-list
 *
 * The UN list is mostly natural-person + entity sanctions; crypto wallet
 * addresses are rarely embedded directly. We extract any 0x-prefixed
 * 40-hex-char tokens defensively in case future revisions include them.
 *
 * Usage: npm run sync:un
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const UN_URL = 'https://scsanctions.un.org/resources/xml/en/consolidated.xml';
const OUTPUT_PATH = resolve(process.cwd(), 'data/sanctions/un-sc.json');
const ETH_ADDRESS_REGEX = /0x[a-fA-F0-9]{40}/g;

interface UnRecord {
  address: string;
  list: 'UN_SC';
  source: {
    source: string;
    url: string;
    retrievedAt: string;
    reference: string;
  };
}

async function fetchList(): Promise<string> {
  const res = await fetch(UN_URL);
  if (!res.ok) throw new Error(`UN SC fetch failed: HTTP ${res.status}`);
  return await res.text();
}

function extract(xml: string): UnRecord[] {
  const matches = xml.match(ETH_ADDRESS_REGEX) ?? [];
  const unique = Array.from(new Set(matches.map((a) => a.toLowerCase())));
  const today = new Date().toISOString();
  return unique.map((address) => ({
    address,
    list: 'UN_SC' as const,
    source: {
      source: 'UN Security Council Consolidated Sanctions List',
      url: UN_URL,
      retrievedAt: today,
      reference: 'UN SC consolidated list',
    },
  }));
}

async function main(): Promise<void> {
  console.log(`[sync-un] Fetching ${UN_URL}...`);
  let records: UnRecord[] = [];
  let fetchOk = false;
  try {
    const xml = await fetchList();
    records = extract(xml);
    fetchOk = true;
  } catch (err) {
    console.warn(`[sync-un] WARN: ${(err as Error).message}`);
  }

  console.log(`[sync-un] Extracted ${records.length} unique ETH-format addresses`);

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  const lastSyncedAt = new Date().toISOString();
  writeFileSync(
    OUTPUT_PATH,
    JSON.stringify(
      {
        list: 'UN_SC',
        lastSyncedAt,
        lastSyncOk: fetchOk,
        count: records.length,
        source: UN_URL,
        addresses: records,
      },
      null,
      2,
    ),
  );
  console.log(`[sync-un] Wrote ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('[sync-un] FAILED:', err);
  process.exit(1);
});
