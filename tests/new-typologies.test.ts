import { describe, it, expect, beforeEach } from 'vitest';
import { detectHighRiskCounterparty } from '../lib/typologies/high-risk-counterparty.js';
import { detectDormantActive } from '../lib/typologies/dormant-active.js';
import { buildContext } from '../lib/engine/analyze.js';
import { computeScoreBreakdown } from '../lib/engine/scorer.js';
import { makeTx, resetCounters, SUBJECT } from './fixtures.js';

const DAY = 86_400;

describe('detectHighRiskCounterparty', () => {
  beforeEach(() => resetCounters());

  it('does not flag when counterparties below threshold', () => {
    const txs = Array.from({ length: 5 }, (_, i) =>
      makeTx({
        direction: 'out',
        from: SUBJECT,
        to: `0x${(i + 1).toString(16).padStart(40, '0')}`,
        valueEth: 1,
      }),
    );
    const flags = detectHighRiskCounterparty(buildContext(SUBJECT, txs));
    expect(flags).toHaveLength(0);
  });

  it('flags when 3 counterparties capture >70% of value out of 60+ peers', () => {
    const txs = [
      // 60 small outflows of 0.01 ETH (=0.6 ETH total)
      ...Array.from({ length: 60 }, (_, i) =>
        makeTx({
          direction: 'out',
          from: SUBJECT,
          to: `0x${(i + 1).toString(16).padStart(40, '0')}`,
          valueEth: 0.01,
        }),
      ),
      // 3 huge outflows totalling 90 ETH (~99% of total)
      ...['aa', 'bb', 'cc'].map((tag) =>
        makeTx({
          direction: 'out',
          from: SUBJECT,
          to: `0x${tag.repeat(20)}`,
          valueEth: 30,
        }),
      ),
    ];
    const flags = detectHighRiskCounterparty(buildContext(SUBJECT, txs));
    expect(flags).toHaveLength(1);
    expect(flags[0].typology).toBe('high_risk_counterparty');
    expect(flags[0].severity).toBe('medium');
  });
});

describe('detectDormantActive', () => {
  beforeEach(() => resetCounters());

  it('does not flag without a dormant gap', () => {
    const base = 1_700_000_000;
    const txs = Array.from({ length: 10 }, (_, i) =>
      makeTx({ timestamp: base + i * DAY, direction: 'in' }),
    );
    const flags = detectDormantActive(buildContext(SUBJECT, txs));
    expect(flags).toHaveLength(0);
  });

  it('flags when 1y+ gap is followed by a burst of 5+ tx in 7 days', () => {
    const base = 1_700_000_000;
    const txs = [
      makeTx({ timestamp: base, direction: 'in' }),
      makeTx({ timestamp: base + 400 * DAY, direction: 'in' }),
      makeTx({ timestamp: base + 400 * DAY + 1 * DAY, direction: 'out' }),
      makeTx({ timestamp: base + 400 * DAY + 2 * DAY, direction: 'out' }),
      makeTx({ timestamp: base + 400 * DAY + 3 * DAY, direction: 'in' }),
      makeTx({ timestamp: base + 400 * DAY + 4 * DAY, direction: 'out' }),
      makeTx({ timestamp: base + 400 * DAY + 5 * DAY, direction: 'in' }),
    ];
    const flags = detectDormantActive(buildContext(SUBJECT, txs));
    expect(flags.length).toBeGreaterThanOrEqual(1);
    expect(flags[0].typology).toBe('dormant_active');
  });

  it('does not flag a gap with too few follow-up tx', () => {
    const base = 1_700_000_000;
    const txs = [
      makeTx({ timestamp: base, direction: 'in' }),
      makeTx({ timestamp: base + 500 * DAY, direction: 'in' }),
      makeTx({ timestamp: base + 500 * DAY + 1 * DAY, direction: 'out' }),
    ];
    const flags = detectDormantActive(buildContext(SUBJECT, txs));
    expect(flags).toHaveLength(0);
  });
});

describe('computeScoreBreakdown', () => {
  it('returns empty for no flags', () => {
    expect(computeScoreBreakdown([])).toEqual([]);
  });

  it('aggregates points per typology and sorts descending', () => {
    const flags = [
      {
        typology: 'mixer_exposure' as const,
        severity: 'high' as const,
        title: 'a',
        description: '',
        evidence: [],
        citations: [],
      },
      {
        typology: 'layering' as const,
        severity: 'medium' as const,
        title: 'b',
        description: '',
        evidence: [],
        citations: [],
      },
      {
        typology: 'mixer_exposure' as const,
        severity: 'medium' as const,
        title: 'c',
        description: '',
        evidence: [],
        citations: [],
      },
    ];
    const breakdown = computeScoreBreakdown(flags);
    expect(breakdown).toHaveLength(2);
    expect(breakdown[0].typology).toBe('mixer_exposure');
    expect(breakdown[0].points).toBeGreaterThan(breakdown[1].points);
  });
});
