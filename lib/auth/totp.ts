import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * RFC 6238 TOTP (Time-based One-Time Password) — HMAC-SHA1, 30-second step,
 * 6-digit codes. Pure Node crypto; no external dependency.
 *
 * Compatible with Google Authenticator, 1Password, Authy, Bitwarden, etc.
 */

const STEP_SECONDS = 30;
const DIGITS = 6;
const SECRET_BYTES = 20; // 160 bits, RFC 4226 §4 recommended length

const RFC4648_BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/** Generate a fresh secret encoded as base32 (no padding). */
export function generateSecret(): string {
  return base32Encode(randomBytes(SECRET_BYTES));
}

/** Build the otpauth:// URI consumed by authenticator apps. */
export function otpauthUri(opts: {
  secret: string;
  accountName: string;
  issuer: string;
}): string {
  const params = new URLSearchParams({
    secret: opts.secret,
    issuer: opts.issuer,
    algorithm: 'SHA1',
    digits: String(DIGITS),
    period: String(STEP_SECONDS),
  });
  const label = encodeURIComponent(`${opts.issuer}:${opts.accountName}`);
  return `otpauth://totp/${label}?${params.toString()}`;
}

/** Compute the TOTP code for a given timestamp (ms). */
export function totpCode(secret: string, atMs: number = Date.now()): string {
  const counter = Math.floor(atMs / 1000 / STEP_SECONDS);
  return hotpCode(secret, counter);
}

/**
 * Verify a user-provided code with ±1-step clock skew tolerance.
 * Constant-time comparison to avoid timing leaks.
 */
export function verifyTotp(
  secret: string,
  code: string,
  atMs: number = Date.now(),
): boolean {
  const trimmed = code.trim();
  if (!/^\d{6}$/.test(trimmed)) return false;
  const counter = Math.floor(atMs / 1000 / STEP_SECONDS);
  for (const offset of [-1, 0, 1] as const) {
    const expected = hotpCode(secret, counter + offset);
    if (constTimeEqual(expected, trimmed)) return true;
  }
  return false;
}

// --- internals ---------------------------------------------------------

function hotpCode(secretBase32: string, counter: number): string {
  const key = base32Decode(secretBase32);
  const buf = Buffer.alloc(8);
  // 8-byte big-endian counter
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buf.writeUInt32BE(counter >>> 0, 4);
  const hmac = createHmac('sha1', key).update(buf).digest();
  const offset = hmac[hmac.length - 1]! & 0x0f;
  const bin =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff);
  const code = (bin % 10 ** DIGITS).toString().padStart(DIGITS, '0');
  return code;
}

function constTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function base32Encode(bytes: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += RFC4648_BASE32[(value >>> (bits - 5)) & 0x1f];
      bits -= 5;
    }
  }
  if (bits > 0) {
    out += RFC4648_BASE32[(value << (5 - bits)) & 0x1f];
  }
  return out;
}

function base32Decode(input: string): Buffer {
  const normalised = input.replace(/=+$/, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of normalised) {
    const idx = RFC4648_BASE32.indexOf(ch);
    if (idx < 0) throw new Error(`Invalid base32 character: ${ch}`);
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}
