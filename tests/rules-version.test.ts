import { describe, it, expect } from 'vitest';
import {
  RULES_VERSION,
  RULES_FINGERPRINT,
  rulesVersionMeta,
  RULES_DATE,
  RULES_REVISION,
} from '../lib/engine/rules-version.js';

describe('rules-version', () => {
  it('exposes a stable, non-empty fingerprint', () => {
    expect(RULES_FINGERPRINT).toMatch(/^[a-f0-9]{16}$/);
  });

  it('returns the same fingerprint on every call (deterministic)', () => {
    const a = rulesVersionMeta();
    const b = rulesVersionMeta();
    expect(a).toEqual(b);
  });

  it('composes RULES_VERSION as date-revision', () => {
    expect(RULES_VERSION).toBe(`${RULES_DATE}-${RULES_REVISION}`);
  });

  it('rulesVersionMeta returns all four fields', () => {
    const meta = rulesVersionMeta();
    expect(meta.rulesVersion).toBeTruthy();
    expect(meta.rulesFingerprint).toBeTruthy();
    expect(meta.rulesDate).toBeTruthy();
    expect(meta.rulesRevision).toBeTruthy();
  });
});
