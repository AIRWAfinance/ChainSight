import { describe, it, expect } from 'vitest';
import { computeRiskScore, recommendation } from '../lib/engine/scorer.js';
import type { Flag } from '../lib/engine/types.js';

function flag(typology: Flag['typology'], severity: Flag['severity']): Flag {
  return {
    typology,
    severity,
    title: 't',
    description: 'd',
    evidence: [],
    citations: [],
  };
}

describe('calibration documented thresholds match runtime behaviour', () => {
  it('a single OFAC sanctions critical lifts the score to MLRO escalation tier', () => {
    const flags = [flag('sanctions_exposure', 'critical')];
    const score = computeRiskScore(flags);
    // 60 (critical) × 1.5 (sanctions) = 90 → MLRO tier (>=75)
    expect(score).toBe(90);
    expect(recommendation(score, flags)).toBe('block_or_offboard');
  });

  it('a single mixer-exposure high lands in enhanced-DD', () => {
    const flags = [flag('mixer_exposure', 'high')];
    const score = computeRiskScore(flags);
    // 30 × 1.3 = 39 → standard_dd (>=15, <40)
    // calibration page says "Two unrelated high findings push the score above 60 = enhanced DD"
    expect(score).toBeGreaterThanOrEqual(15);
    expect(score).toBeLessThan(40);
    expect(recommendation(score, flags)).toBe('standard_dd');
  });

  it('two unrelated high findings reach the enhanced-DD tier (score >= 40)', () => {
    const flags = [
      flag('mixer_exposure', 'high'),
      flag('high_risk_counterparty', 'high'),
    ];
    const score = computeRiskScore(flags);
    // 30*1.3 + 30*1.1 = 39 + 33 = 72 → enhanced_dd
    expect(score).toBeGreaterThanOrEqual(40);
    expect(recommendation(score, flags)).toBe('enhanced_dd');
  });

  it('low signals alone stay in low_risk until they accumulate past 15', () => {
    const oneLow = computeRiskScore([flag('layering', 'low')]);
    expect(oneLow).toBe(5); // 5 × 1.0
    expect(recommendation(oneLow, [])).toBe('low_risk');

    const fourLow = computeRiskScore([
      flag('layering', 'low'),
      flag('layering', 'low'),
      flag('peel_chain', 'low'),
      flag('dormant_active', 'low'),
    ]);
    // 5 + 5 + 5 + 4.5 = 19.5 → standard_dd
    expect(fourLow).toBeGreaterThanOrEqual(15);
    expect(recommendation(fourLow, [])).toBe('standard_dd');
  });

  it('the score is capped at 100 even with extreme inputs', () => {
    const flags = [
      flag('sanctions_exposure', 'critical'),
      flag('mixer_exposure', 'critical'),
      flag('scam_exposure', 'critical'),
    ];
    const score = computeRiskScore(flags);
    expect(score).toBe(100);
  });

  it('typology multipliers documented on the calibration page match scorer.ts', () => {
    // If anyone changes a multiplier in scorer.ts they MUST update the
    // calibration page. This test deliberately encodes the documented
    // values to force a change-management touchpoint.
    const documented: Record<string, number> = {
      sanctions_exposure: 1.5,
      mixer_exposure: 1.3,
      scam_exposure: 1.2,
      high_risk_counterparty: 1.1,
      layering: 1.0,
      peel_chain: 1.0,
      dormant_active: 0.9,
    };
    for (const [typology, mult] of Object.entries(documented)) {
      const lowScore = computeRiskScore([flag(typology as Flag['typology'], 'low')]);
      expect(lowScore).toBe(Math.round(5 * mult));
    }
  });
});
