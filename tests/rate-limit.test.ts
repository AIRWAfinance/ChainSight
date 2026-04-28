import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkRateLimit,
  clearAllRateLimits,
  clientKey,
} from '../lib/auth/rate-limit.js';

beforeEach(() => clearAllRateLimits());

describe('checkRateLimit', () => {
  it('allows the first attempt and decrements remaining', () => {
    const r = checkRateLimit('a::b', { windowSeconds: 60, maxAttempts: 5 });
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(4);
    expect(r.retryAfterSeconds).toBe(0);
  });

  it('blocks after reaching maxAttempts', () => {
    for (let i = 0; i < 5; i += 1) {
      checkRateLimit('a::b', { windowSeconds: 60, maxAttempts: 5 });
    }
    const r = checkRateLimit('a::b', { windowSeconds: 60, maxAttempts: 5 });
    expect(r.allowed).toBe(false);
    expect(r.remaining).toBe(0);
    expect(r.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('isolates buckets by key', () => {
    for (let i = 0; i < 5; i += 1) {
      checkRateLimit('ip1::user', { windowSeconds: 60, maxAttempts: 5 });
    }
    const blocked = checkRateLimit('ip1::user', {
      windowSeconds: 60,
      maxAttempts: 5,
    });
    const ok = checkRateLimit('ip2::user', {
      windowSeconds: 60,
      maxAttempts: 5,
    });
    expect(blocked.allowed).toBe(false);
    expect(ok.allowed).toBe(true);
  });
});

describe('clientKey', () => {
  it('lowercases and combines IP and identifier', () => {
    expect(clientKey('1.2.3.4', 'User@Example.COM')).toBe(
      '1.2.3.4::user@example.com',
    );
  });

  it('replaces missing IP with "unknown"', () => {
    expect(clientKey(null, 'a@b.com')).toBe('unknown::a@b.com');
    expect(clientKey(undefined, 'a@b.com')).toBe('unknown::a@b.com');
  });
});
