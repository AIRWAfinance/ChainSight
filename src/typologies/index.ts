import type { AddressContext, Flag, TypologyId } from '../engine/types.js';
import { detectSanctionsExposure } from './sanctions-exposure.js';
import { detectMixerExposure } from './mixer-exposure.js';
import { detectScamExposure } from './scam-exposure.js';
import { detectLayering } from './layering.js';
import { detectPeelChain } from './peel-chain.js';

export const ALL_TYPOLOGIES: TypologyId[] = [
  'sanctions_exposure',
  'mixer_exposure',
  'scam_exposure',
  'layering',
  'peel_chain',
];

export function runAllTypologies(ctx: AddressContext): Flag[] {
  return [
    ...detectSanctionsExposure(ctx),
    ...detectMixerExposure(ctx),
    ...detectScamExposure(ctx),
    ...detectLayering(ctx),
    ...detectPeelChain(ctx),
  ];
}
