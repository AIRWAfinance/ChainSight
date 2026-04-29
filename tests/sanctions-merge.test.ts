import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  clearSanctionsCache,
  getSanctionsFreshness,
  isSanctioned,
  loadSanctionsList,
} from '../lib/data/sanctions.js';

let originalCwd: string;
let workDir: string;

const SAMPLE_ADDR = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const ONLY_OFAC = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const ONLY_EU = '0xcccccccccccccccccccccccccccccccccccccccc';

function writeListFile(
  cwd: string,
  filename: string,
  data: Record<string, unknown>,
): void {
  mkdirSync(join(cwd, 'data', 'sanctions'), { recursive: true });
  writeFileSync(join(cwd, 'data', 'sanctions', filename), JSON.stringify(data));
}

beforeEach(() => {
  originalCwd = process.cwd();
  workDir = mkdtempSync(join(tmpdir(), 'chainsight-sanctions-'));
  process.chdir(workDir);
  clearSanctionsCache();
});

afterEach(() => {
  process.chdir(originalCwd);
  rmSync(workDir, { recursive: true, force: true });
  clearSanctionsCache();
});

describe('sanctions multi-list merge', () => {
  it('merges an address present in OFAC + EU into a single record with both lists', () => {
    const now = new Date().toISOString();
    writeListFile(workDir, 'ofac-sdn.json', {
      list: 'OFAC_SDN',
      lastSyncedAt: now,
      lastSyncOk: true,
      count: 1,
      addresses: [
        {
          address: SAMPLE_ADDR,
          list: 'OFAC_SDN',
          source: { source: 'OFAC', url: 'https://x', retrievedAt: now },
        },
      ],
    });
    writeListFile(workDir, 'eu-consolidated.json', {
      list: 'EU_CFSP',
      lastSyncedAt: now,
      lastSyncOk: true,
      count: 1,
      addresses: [
        {
          address: SAMPLE_ADDR,
          list: 'EU_CFSP',
          source: { source: 'EU', url: 'https://y', retrievedAt: now },
        },
      ],
    });

    const hit = isSanctioned(SAMPLE_ADDR);
    expect(hit).not.toBeNull();
    expect(hit!.lists).toEqual(expect.arrayContaining(['OFAC_SDN', 'EU_CFSP']));
    expect(hit!.lists).toHaveLength(2);
  });

  it('keeps single-list addresses with one-element lists array', () => {
    const now = new Date().toISOString();
    writeListFile(workDir, 'ofac-sdn.json', {
      list: 'OFAC_SDN',
      lastSyncedAt: now,
      lastSyncOk: true,
      count: 1,
      addresses: [
        {
          address: ONLY_OFAC,
          list: 'OFAC_SDN',
          source: { source: 'OFAC', url: 'https://x', retrievedAt: now },
        },
      ],
    });
    writeListFile(workDir, 'eu-consolidated.json', {
      list: 'EU_CFSP',
      lastSyncedAt: now,
      lastSyncOk: true,
      count: 1,
      addresses: [
        {
          address: ONLY_EU,
          list: 'EU_CFSP',
          source: { source: 'EU', url: 'https://y', retrievedAt: now },
        },
      ],
    });

    expect(isSanctioned(ONLY_OFAC)!.lists).toEqual(['OFAC_SDN']);
    expect(isSanctioned(ONLY_EU)!.lists).toEqual(['EU_CFSP']);
    expect(loadSanctionsList().size).toBe(2);
  });

  it('preserves backwards-compatible primary list field', () => {
    const now = new Date().toISOString();
    writeListFile(workDir, 'ofac-sdn.json', {
      list: 'OFAC_SDN',
      lastSyncedAt: now,
      addresses: [
        {
          address: SAMPLE_ADDR,
          list: 'OFAC_SDN',
          source: { source: 'OFAC', url: 'https://x', retrievedAt: now },
        },
      ],
    });
    writeListFile(workDir, 'eu-consolidated.json', {
      list: 'EU_CFSP',
      lastSyncedAt: now,
      addresses: [
        {
          address: SAMPLE_ADDR,
          list: 'EU_CFSP',
          source: { source: 'EU', url: 'https://y', retrievedAt: now },
        },
      ],
    });

    const hit = isSanctioned(SAMPLE_ADDR)!;
    // First list in load order is OFAC.
    expect(hit.list).toBe('OFAC_SDN');
  });
});

describe('sanctions freshness', () => {
  it('flags missing files as stale', () => {
    const f = getSanctionsFreshness();
    expect(f).toHaveLength(4);
    expect(f.every((x) => x.isStale)).toBe(true);
  });

  it('reports fresh state when file is recent', () => {
    const recent = new Date().toISOString();
    writeListFile(workDir, 'ofac-sdn.json', {
      list: 'OFAC_SDN',
      lastSyncedAt: recent,
      lastSyncOk: true,
      count: 5,
      addresses: [],
    });

    const f = getSanctionsFreshness().find((x) => x.list === 'OFAC_SDN')!;
    expect(f.isStale).toBe(false);
    expect(f.ageHours).toBeLessThan(1);
    expect(f.lastSyncOk).toBe(true);
    expect(f.fileExists).toBe(true);
  });

  it('reports stale when file is >24h old', () => {
    const old = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    writeListFile(workDir, 'eu-consolidated.json', {
      list: 'EU_CFSP',
      lastSyncedAt: old,
      lastSyncOk: true,
      count: 0,
      addresses: [],
    });

    const f = getSanctionsFreshness().find((x) => x.list === 'EU_CFSP')!;
    expect(f.isStale).toBe(true);
    expect(f.ageHours).toBeGreaterThan(24);
  });
});
