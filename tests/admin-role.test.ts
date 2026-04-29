import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { SqliteStorage } from '../lib/storage/sqlite.js';

let tmp: string;
let store: SqliteStorage;

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'chainsight-admin-'));
  store = new SqliteStorage(join(tmp, 'test.db'));
});

afterEach(() => {
  store.close();
  rmSync(tmp, { recursive: true, force: true });
});

describe('admin role storage', () => {
  it('new users default to role=user', async () => {
    const u = await store.createUser('a@b.com', 'hash');
    const fetched = await store.findUserById(u.id);
    expect(fetched?.role).toBe('user');
  });

  it('setUserRole promotes to admin and back', async () => {
    const u = await store.createUser('a@b.com', 'hash');
    await store.setUserRole(u.id, 'admin');
    let fetched = await store.findUserById(u.id);
    expect(fetched?.role).toBe('admin');
    await store.setUserRole(u.id, 'user');
    fetched = await store.findUserById(u.id);
    expect(fetched?.role).toBe('user');
  });

  it('findUserByEmail returns role', async () => {
    const u = await store.createUser('a@b.com', 'hash');
    await store.setUserRole(u.id, 'admin');
    const found = await store.findUserByEmail('a@b.com');
    expect(found?.user.role).toBe('admin');
  });

  it('listUsers + countUsers reflect role + MFA', async () => {
    const a = await store.createUser('admin@example.com', 'h1');
    await store.createUser('user@example.com', 'h2');
    const c = await store.createUser('mfa@example.com', 'h3');
    await store.setUserRole(a.id, 'admin');
    await store.setUserTotpSecret(c.id, 'JBSWY3DPEHPK3PXP');
    await store.setUserTotpVerified(c.id);

    const list = await store.listUsers();
    expect(list).toHaveLength(3);
    const counts = await store.countUsers();
    expect(counts.total).toBe(3);
    expect(counts.admins).toBe(1);
    expect(counts.mfaEnabled).toBe(1);
  });
});

describe('adminEmailAllowlist', () => {
  it('reads CHAINSIGHT_ADMIN_EMAILS env var', async () => {
    const original = process.env['CHAINSIGHT_ADMIN_EMAILS'];
    try {
      process.env['CHAINSIGHT_ADMIN_EMAILS'] = 'jorge@AIRWA.finance, other@ex.com';
      const mod = await import('../lib/auth/admin.js?case=' + Date.now());
      const set = mod.adminEmailAllowlist();
      expect(set.has('jorge@airwa.finance')).toBe(true);
      expect(set.has('other@ex.com')).toBe(true);
      expect(set.has('not-listed@ex.com')).toBe(false);
    } finally {
      process.env['CHAINSIGHT_ADMIN_EMAILS'] = original;
    }
  });

  it('returns empty set when unset', async () => {
    const original = process.env['CHAINSIGHT_ADMIN_EMAILS'];
    try {
      delete process.env['CHAINSIGHT_ADMIN_EMAILS'];
      const mod = await import('../lib/auth/admin.js?empty=' + Date.now());
      expect(mod.adminEmailAllowlist().size).toBe(0);
    } finally {
      process.env['CHAINSIGHT_ADMIN_EMAILS'] = original;
    }
  });
});
