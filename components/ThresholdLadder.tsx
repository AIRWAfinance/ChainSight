import type { RiskRecommendation } from '@/lib/engine/types';

interface ThresholdLadderProps {
  score: number;
}

const TIERS: Array<{
  label: string;
  range: string;
  min: number;
  max: number;
  color: string;
}> = [
  { label: 'Low risk', range: '0—24', min: 0, max: 24, color: 'var(--t-low)' },
  { label: 'Standard DD', range: '25—49', min: 25, max: 49, color: 'var(--t-med)' },
  { label: 'Enhanced DD', range: '50—74', min: 50, max: 74, color: 'var(--t-high)' },
  { label: 'Block / SAR', range: '75—100', min: 75, max: 100, color: 'var(--t-crit)' },
];

export function ThresholdLadder({ score }: ThresholdLadderProps) {
  return (
    <div className="ladder">
      {TIERS.map((tier) => {
        const active = score >= tier.min && score <= tier.max;
        return (
          <div key={tier.label} className={`row${active ? ' active' : ''}`}>
            <span>
              <span className="dot" style={{ background: tier.color }} />
              {tier.label}
            </span>
            <span className="range">{tier.range}</span>
          </div>
        );
      })}
    </div>
  );
}

export function recommendationLabel(rec: RiskRecommendation): string {
  switch (rec) {
    case 'low_risk': return 'Low risk';
    case 'standard_dd': return 'Standard DD';
    case 'enhanced_dd': return 'Enhanced DD';
    case 'escalate_to_mlro': return 'Escalate · MLRO';
    case 'block_or_offboard': return 'Block / SAR';
  }
}

export function recommendationProse(rec: RiskRecommendation): string {
  switch (rec) {
    case 'low_risk':
      return 'No escalation indicated. Activity falls within the expected behavioral envelope; standard onboarding suffices.';
    case 'standard_dd':
      return 'Routine customer due diligence indicated. No escalation triggers; activity falls within the expected behavioral envelope.';
    case 'enhanced_dd':
      return 'Enhanced due diligence recommended. Verify source of funds, document counterparty relationships, and review periodically.';
    case 'escalate_to_mlro':
      return 'Escalate to the Money Laundering Reporting Officer. The wallet exhibits multiple high-severity typologies that warrant manual review and potential SAR filing.';
    case 'block_or_offboard':
      return 'Block or off-board immediately. Sanctions or critical-severity AML typologies have been triggered. Consider mandatory reporting obligations.';
  }
}
