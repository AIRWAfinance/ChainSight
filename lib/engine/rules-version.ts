import { createHash } from 'node:crypto';

const SEVERITY_WEIGHT_SOURCE = {
  low: 5,
  medium: 15,
  high: 30,
  critical: 60,
};

const TYPOLOGY_MULTIPLIER_SOURCE = {
  sanctions_exposure: 1.5,
  mixer_exposure: 1.3,
  scam_exposure: 1.2,
  layering: 1.0,
  peel_chain: 1.0,
  high_risk_counterparty: 1.1,
  dormant_active: 0.9,
};

const DETECTOR_REGISTRY = [
  { id: 'sanctions_exposure', tunables: { matchMode: 'exact_lowercase', lists: ['OFAC_SDN', 'EU_CFSP', 'UK_HMT', 'UN_SC'] } },
  { id: 'mixer_exposure', tunables: { source: 'curated/mixers.json' } },
  { id: 'scam_exposure', tunables: { source: 'curated/scams.json' } },
  { id: 'layering', tunables: { windowSeconds: 3600, valueTolerance: 0.05, minValueEth: 0.01, minMatches: 3 } },
  { id: 'peel_chain', tunables: { decreasingTolerance: 0.10, minLinks: 4 } },
  { id: 'high_risk_counterparty', tunables: { concentrationThreshold: 0.70, minDistinctCounterparties: 4 } },
  { id: 'dormant_active', tunables: { dormancyDays: 365, burstWindowDays: 7 } },
];

export const RULES_DATE = '2026-04-28';
export const RULES_REVISION = 'r1';

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}

function computeFingerprint(): string {
  const payload = stableStringify({
    severityWeights: SEVERITY_WEIGHT_SOURCE,
    typologyMultipliers: TYPOLOGY_MULTIPLIER_SOURCE,
    detectors: DETECTOR_REGISTRY,
    rulesDate: RULES_DATE,
    rulesRevision: RULES_REVISION,
  });
  return createHash('sha256').update(payload).digest('hex').slice(0, 16);
}

const FINGERPRINT = computeFingerprint();

export const RULES_VERSION = `${RULES_DATE}-${RULES_REVISION}`;
export const RULES_FINGERPRINT = FINGERPRINT;
export const RULES_VERSION_FULL = `${RULES_VERSION}-${FINGERPRINT}`;

export interface RulesVersionMeta {
  rulesVersion: string;
  rulesFingerprint: string;
  rulesDate: string;
  rulesRevision: string;
}

export function rulesVersionMeta(): RulesVersionMeta {
  return {
    rulesVersion: RULES_VERSION,
    rulesFingerprint: RULES_FINGERPRINT,
    rulesDate: RULES_DATE,
    rulesRevision: RULES_REVISION,
  };
}
