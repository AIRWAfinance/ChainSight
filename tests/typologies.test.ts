import { describe, it, expect, beforeEach } from 'vitest';
import { detectMixerExposure } from '../lib/typologies/mixer-exposure.js';
import { detectLayering } from '../lib/typologies/layering.js';
import { detectPeelChain } from '../lib/typologies/peel-chain.js';
import { buildContext } from '../lib/engine/analyze.js';
import {
  makeTx,
  resetCounters,
  SUBJECT,
  TORNADO_ROUTER,
  RANDOM_PEER_A,
  RANDOM_PEER_B,
  RANDOM_PEER_C,
  RANDOM_PEER_D,
  RANDOM_PEER_E,
} from './fixtures.js';

beforeEach(() => resetCounters());

describe('detectMixerExposure', () => {
  it('flags transfer to Tornado Cash router', () => {
    const ctx = buildContext(SUBJECT, [
      makeTx({
        from: SUBJECT,
        to: TORNADO_ROUTER,
        direction: 'out',
        valueEth: 1.5,
      }),
    ]);
    const flags = detectMixerExposure(ctx);
    expect(flags).toHaveLength(1);
    expect(flags[0].typology).toBe('mixer_exposure');
    expect(flags[0].severity).toBe('high');
  });

  it('returns no flag for non-mixer counterparty', () => {
    const ctx = buildContext(SUBJECT, [
      makeTx({ from: SUBJECT, to: RANDOM_PEER_A, direction: 'out' }),
    ]);
    expect(detectMixerExposure(ctx)).toHaveLength(0);
  });

  it('escalates severity to critical for >=10 ETH mixer exposure', () => {
    const ctx = buildContext(SUBJECT, [
      makeTx({ from: SUBJECT, to: TORNADO_ROUTER, direction: 'out', valueEth: 12 }),
    ]);
    const flags = detectMixerExposure(ctx);
    expect(flags[0].severity).toBe('critical');
  });
});

describe('detectLayering', () => {
  it('flags rapid pass-through pattern', () => {
    const txs = [];
    let t = 1_700_000_000;
    for (let i = 0; i < 5; i += 1) {
      txs.push(
        makeTx({
          from: RANDOM_PEER_A,
          to: SUBJECT,
          direction: 'in',
          valueEth: 1,
          timestamp: t,
        }),
      );
      txs.push(
        makeTx({
          from: SUBJECT,
          to: RANDOM_PEER_B,
          direction: 'out',
          valueEth: 1,
          timestamp: t + 60,
        }),
      );
      t += 3600;
    }
    const ctx = buildContext(SUBJECT, txs);
    const flags = detectLayering(ctx);
    expect(flags).toHaveLength(1);
    expect(flags[0].typology).toBe('layering');
  });

  it('does not flag long-held funds', () => {
    const ctx = buildContext(SUBJECT, [
      makeTx({
        from: RANDOM_PEER_A,
        to: SUBJECT,
        direction: 'in',
        valueEth: 1,
        timestamp: 1_700_000_000,
      }),
      makeTx({
        from: SUBJECT,
        to: RANDOM_PEER_B,
        direction: 'out',
        valueEth: 1,
        timestamp: 1_700_000_000 + 3600 * 24 * 30,
      }),
    ]);
    expect(detectLayering(ctx)).toHaveLength(0);
  });
});

describe('detectPeelChain', () => {
  it('flags decreasing sequential outflows', () => {
    let t = 1_700_000_000;
    const recipients = [RANDOM_PEER_A, RANDOM_PEER_B, RANDOM_PEER_C, RANDOM_PEER_D, RANDOM_PEER_E];
    const txs = [10, 6, 4, 2, 1].map((eth, i) => {
      const tx = makeTx({
        from: SUBJECT,
        to: recipients[i],
        direction: 'out',
        valueEth: eth,
        timestamp: t,
      });
      t += 1800;
      return tx;
    });
    const ctx = buildContext(SUBJECT, txs);
    const flags = detectPeelChain(ctx);
    expect(flags.length).toBeGreaterThanOrEqual(1);
    expect(flags[0].typology).toBe('peel_chain');
  });

  it('does not flag uniform outflows', () => {
    let t = 1_700_000_000;
    const txs = Array.from({ length: 5 }, () => {
      const tx = makeTx({
        from: SUBJECT,
        to: RANDOM_PEER_A,
        direction: 'out',
        valueEth: 1,
        timestamp: t,
      });
      t += 1800;
      return tx;
    });
    const ctx = buildContext(SUBJECT, txs);
    expect(detectPeelChain(ctx)).toHaveLength(0);
  });
});
