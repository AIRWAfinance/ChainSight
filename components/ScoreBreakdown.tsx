import type { ScoreContribution, TypologyId } from '@/lib/engine/types';

const LABELS: Record<TypologyId, string> = {
  sanctions_exposure: 'Sanctions exposure',
  mixer_exposure: 'Mixer exposure',
  scam_exposure: 'Scam exposure',
  layering: 'Layering',
  peel_chain: 'Peel chain',
  high_risk_counterparty: 'High-risk counterparty',
  dormant_active: 'Dormant-then-active',
};

const COLORS: Record<TypologyId, string> = {
  sanctions_exposure: 'var(--t-crit)',
  mixer_exposure: 'var(--t-high)',
  scam_exposure: 'var(--t-high)',
  layering: 'var(--gold)',
  peel_chain: 'var(--gold)',
  high_risk_counterparty: 'var(--t-med)',
  dormant_active: 'var(--t-low)',
};

interface ScoreBreakdownProps {
  breakdown: ScoreContribution[];
  total: number;
}

export function ScoreBreakdown({ breakdown, total }: ScoreBreakdownProps) {
  if (breakdown.length === 0) return null;

  const sum = Math.max(
    1,
    breakdown.reduce((s, c) => s + c.points, 0),
  );

  return (
    <div className="score-breakdown">
      <div className="lbl">Score breakdown</div>
      <div className="bar-stack">
        {breakdown.map((c) => {
          const pct = (c.points / sum) * 100;
          return (
            <span
              key={c.typology}
              className="bar-seg"
              style={{ width: `${pct}%`, background: COLORS[c.typology] ?? 'var(--gold)' }}
              title={`${LABELS[c.typology]} — ${c.points} pts`}
            />
          );
        })}
      </div>
      <ul className="legend">
        {breakdown.map((c) => (
          <li key={c.typology}>
            <span
              className="dot"
              style={{ background: COLORS[c.typology] ?? 'var(--gold)' }}
            />
            <span className="label">{LABELS[c.typology] ?? c.typology}</span>
            <span className="pts">+{c.points}</span>
          </li>
        ))}
      </ul>
      <div className="cap-note">
        Composite (capped at 100): <b>{total}</b>
      </div>
    </div>
  );
}
