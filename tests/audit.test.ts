import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { SqliteStorage } from '../lib/storage/sqlite.js';
import { hashPayload } from '../lib/audit/hash.js';

let tmp: string;
let store: SqliteStorage;

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'chainsight-audit-'));
  store = new SqliteStorage(join(tmp, 'test.db'));
});

afterEach(() => {
  store.close();
  rmSync(tmp, { recursive: true, force: true });
});

describe('audit append + list', () => {
  it('appends an event and returns it with id, ts, payloadHash', async () => {
    const ev = await store.appendAudit({
      actorUserId: 'u-1',
      actorIp: '1.2.3.4',
      action: 'auth.login.success',
      targetType: 'user',
      targetId: 'u-1',
      payload: { email: 'a@b.com' },
    });
    expect(ev.id).toBeTruthy();
    expect(ev.ts).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(ev.payloadHash).toMatch(/^[a-f0-9]{64}$/);
    expect(ev.action).toBe('auth.login.success');
  });

  it('payloadHash matches stable-stringified payload (tamper-detection)', async () => {
    const payload = { email: 'a@b.com', userId: 'u-1' };
    const ev = await store.appendAudit({
      actorUserId: 'u-1',
      actorIp: null,
      action: 'auth.login.success',
      targetType: 'user',
      targetId: 'u-1',
      payload,
    });
    expect(ev.payloadHash).toBe(hashPayload(payload));
  });

  it('hash is stable regardless of payload key order', () => {
    const a = hashPayload({ a: 1, b: 2 });
    const b = hashPayload({ b: 2, a: 1 });
    expect(a).toBe(b);
  });

  it('lists events newest first', async () => {
    await store.appendAudit({
      actorUserId: 'u-1',
      actorIp: null,
      action: 'auth.login.success',
      targetType: 'user',
      targetId: 'u-1',
      payload: { n: 1 },
    });
    // Slight delay to ensure ts ordering on systems with millisecond resolution
    await new Promise((r) => setTimeout(r, 5));
    await store.appendAudit({
      actorUserId: 'u-1',
      actorIp: null,
      action: 'scan.run',
      targetType: 'scan',
      targetId: null,
      payload: { n: 2 },
    });
    const list = await store.listAudit({ userId: 'u-1' });
    expect(list).toHaveLength(2);
    expect(list[0]!.action).toBe('scan.run');
    expect(list[1]!.action).toBe('auth.login.success');
  });

  it('filters by user, action, and targetType', async () => {
    await store.appendAudit({
      actorUserId: 'u-1',
      actorIp: null,
      action: 'auth.login.success',
      targetType: 'user',
      targetId: 'u-1',
      payload: {},
    });
    await store.appendAudit({
      actorUserId: 'u-2',
      actorIp: null,
      action: 'auth.login.success',
      targetType: 'user',
      targetId: 'u-2',
      payload: {},
    });
    await store.appendAudit({
      actorUserId: 'u-1',
      actorIp: null,
      action: 'scan.run',
      targetType: 'scan',
      targetId: null,
      payload: {},
    });

    const userOnly = await store.listAudit({ userId: 'u-1' });
    expect(userOnly).toHaveLength(2);

    const actionOnly = await store.listAudit({ action: 'scan.run' });
    expect(actionOnly).toHaveLength(1);

    const combined = await store.listAudit({
      userId: 'u-1',
      targetType: 'scan',
    });
    expect(combined).toHaveLength(1);
    expect(combined[0]!.action).toBe('scan.run');
  });

  it('storage interface exposes append + list only — no update/delete', () => {
    // Tamper-evidence design: there is intentionally no updateAudit / deleteAudit.
    expect(
      Object.getOwnPropertyNames(SqliteStorage.prototype),
    ).toContain('appendAudit');
    expect(
      Object.getOwnPropertyNames(SqliteStorage.prototype),
    ).toContain('listAudit');
    expect(
      Object.getOwnPropertyNames(SqliteStorage.prototype),
    ).not.toContain('updateAudit');
    expect(
      Object.getOwnPropertyNames(SqliteStorage.prototype),
    ).not.toContain('deleteAudit');
  });
});
