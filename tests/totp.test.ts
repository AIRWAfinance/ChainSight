import { describe, it, expect } from 'vitest';
import {
  generateSecret,
  totpCode,
  verifyTotp,
  otpauthUri,
} from '../lib/auth/totp.js';

describe('totp.generateSecret', () => {
  it('produces a base32 string of expected length (160-bit secret)', () => {
    const s = generateSecret();
    expect(s).toMatch(/^[A-Z2-7]+$/);
    // 160 bits = 32 base32 chars
    expect(s.length).toBe(32);
  });

  it('generates different secrets each call', () => {
    const a = generateSecret();
    const b = generateSecret();
    expect(a).not.toBe(b);
  });
});

describe('totp.totpCode + verifyTotp', () => {
  it('round-trips: a generated code verifies against the same secret', () => {
    const secret = generateSecret();
    const code = totpCode(secret);
    expect(code).toMatch(/^\d{6}$/);
    expect(verifyTotp(secret, code)).toBe(true);
  });

  it('rejects an obviously wrong code', () => {
    const secret = generateSecret();
    expect(verifyTotp(secret, '000000')).toBe(false);
  });

  it('rejects malformed codes (length, non-digit)', () => {
    const secret = generateSecret();
    expect(verifyTotp(secret, '12345')).toBe(false);
    expect(verifyTotp(secret, '1234567')).toBe(false);
    expect(verifyTotp(secret, 'abcdef')).toBe(false);
    expect(verifyTotp(secret, '')).toBe(false);
  });

  it('accepts a code from the previous time-step (clock skew tolerance)', () => {
    const secret = generateSecret();
    const past = Date.now() - 30_000; // exactly one step earlier
    const code = totpCode(secret, past);
    expect(verifyTotp(secret, code)).toBe(true);
  });

  it('accepts a code from the next time-step (clock skew tolerance)', () => {
    const secret = generateSecret();
    const future = Date.now() + 30_000; // one step ahead
    const code = totpCode(secret, future);
    expect(verifyTotp(secret, code)).toBe(true);
  });

  it('rejects a code from far in the past (no skew window)', () => {
    const secret = generateSecret();
    const long = Date.now() - 120_000; // 4 steps earlier
    const code = totpCode(secret, long);
    expect(verifyTotp(secret, code)).toBe(false);
  });

  it('matches the documented RFC 6238 SHA-1 reference at T=59', () => {
    // RFC 6238 Appendix B test vectors use the ASCII secret "12345678901234567890"
    // base32: GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ. Expected code at T=59 = 94287082.
    // Our implementation truncates to 6 digits per the spec default; the
    // reference vector's last 6 digits are "287082".
    const secretBase32 = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
    const code = totpCode(secretBase32, 59 * 1000);
    expect(code).toBe('287082');
  });
});

describe('totp.otpauthUri', () => {
  it('builds a parseable otpauth URI with issuer and account', () => {
    const uri = otpauthUri({
      secret: 'JBSWY3DPEHPK3PXP',
      accountName: 'jorge@example.com',
      issuer: 'ChainSight',
    });
    expect(uri).toMatch(/^otpauth:\/\/totp\//);
    expect(uri).toContain('secret=JBSWY3DPEHPK3PXP');
    expect(uri).toContain('issuer=ChainSight');
    expect(uri).toContain('algorithm=SHA1');
    expect(uri).toContain('digits=6');
    expect(uri).toContain('period=30');
    // Label segment must encode the colon between issuer and account.
    expect(uri).toContain('ChainSight%3Ajorge');
  });
});
