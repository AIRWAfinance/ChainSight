import { describe, it, expect } from 'vitest';
import { computeRiskScore, recommendation } from '../src/engine/scorer.js';
import type { Flag } from '../src/engine/types.js';

const baseFlag = (overrides: Partial<Flag>): Flag => ({
  typology: 'layering',
  severity: 'medium',
  title: 't',
  description: 'd',
  evidence: [],
  citations: [],
  ...overrides,
});

describe('computeRiskScore', () => {
  it('returns 0 with no flags', () => {
    expect(computeRiskScore([])).toBe(0);
  });

  it('weights critical sanctions flag heavily', () => {
    const score = computeRiskScore([
      baseFlag({ typology: 'sanctions_exposure', severity: 'critical' }),
    ]);
    expect(score).toBeGreaterThanOrEqual(75);
  });

  it('caps at 100', () => {
    const flags = Array.from({ length: 10 }, () =>
      baseFlag({ typology: 'sanctions_exposure', severity: 'critical' }),
    );
    expect(computeRiskScore(flags)).toBe(100);
  });

  it('low severity layering produces low score', () => {
    const score = computeRiskScore([
      baseFlag({ typology: 'layering', severity: 'low' }),
    ]);
    expect(score).toBeLessThan(15);
  });
});

describe('recommendation', () => {
  it('block_or_offboard for critical sanctions', () => {
    const flags = [baseFlag({ typology: 'sanctions_exposure', severity: 'critical' })];
    expect(recommendation(80, flags)).toBe('block_or_offboard');
  });

  it('escalate_to_mlro for high score without sanctions', () => {
    const flags = [baseFlag({ typology: 'mixer_exposure', severity: 'high' })];
    expect(recommendation(80, flags)).toBe('escalate_to_mlro');
  });

  it('low_risk for empty flags', () => {
    expect(recommendation(0, [])).toBe('low_risk');
  });

  it('standard_dd for moderate score', () => {
    expect(recommendation(20, [baseFlag({ severity: 'medium' })])).toBe('standard_dd');
  });
});
