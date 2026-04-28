import type {
  Flag,
  RiskRecommendation,
  Severity,
  TypologyId,
} from './types.js';

const SEVERITY_WEIGHT: Record<Severity, number> = {
  low: 5,
  medium: 15,
  high: 30,
  critical: 60,
};

const TYPOLOGY_MULTIPLIER: Record<TypologyId, number> = {
  sanctions_exposure: 1.5,
  mixer_exposure: 1.3,
  scam_exposure: 1.2,
  layering: 1.0,
  peel_chain: 1.0,
};

export function computeRiskScore(flags: Flag[]): number {
  if (flags.length === 0) return 0;

  let raw = 0;
  for (const flag of flags) {
    const base = SEVERITY_WEIGHT[flag.severity];
    const multiplier = TYPOLOGY_MULTIPLIER[flag.typology] ?? 1;
    raw += base * multiplier;
  }

  return Math.min(100, Math.round(raw));
}

export function recommendation(score: number, flags: Flag[]): RiskRecommendation {
  const hasCritical = flags.some((f) => f.severity === 'critical');
  const hasSanctions = flags.some((f) => f.typology === 'sanctions_exposure');

  if (hasSanctions && hasCritical) return 'block_or_offboard';
  if (score >= 75) return 'escalate_to_mlro';
  if (score >= 40) return 'enhanced_dd';
  if (score >= 15) return 'standard_dd';
  return 'low_risk';
}
