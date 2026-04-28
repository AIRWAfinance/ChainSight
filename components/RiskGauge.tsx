interface RiskGaugeProps {
  score: number;
}

const ARC_LENGTH = 540;
const ACTIVE_RATIO = 0.6;

export function RiskGauge({ score }: RiskGaugeProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const dashLen = (clamped / 100) * (ARC_LENGTH * ACTIVE_RATIO);

  let activeColor = 'var(--gold)';
  let valueClass = '';
  if (clamped >= 75) {
    activeColor = 'var(--t-crit)';
    valueClass = 'crit';
  } else if (clamped >= 50) {
    activeColor = 'var(--t-high)';
    valueClass = 'high';
  } else if (clamped >= 25) {
    activeColor = 'var(--t-med)';
  } else {
    activeColor = 'var(--t-low)';
  }

  return (
    <div className="gauge-wrap">
      <svg viewBox="0 0 200 200" aria-label={`Risk score ${clamped} out of 100`}>
        <circle cx="100" cy="100" r="86" fill="none" stroke="var(--line)" strokeWidth="14" />
        <circle
          cx="100" cy="100" r="86" fill="none"
          stroke="var(--t-low)" strokeWidth="2"
          strokeDasharray="135 405" strokeDashoffset="0" opacity="0.45"
        />
        <circle
          cx="100" cy="100" r="86" fill="none"
          stroke="var(--t-med)" strokeWidth="2"
          strokeDasharray="135 405" strokeDashoffset="-135" opacity="0.45"
        />
        <circle
          cx="100" cy="100" r="86" fill="none"
          stroke="var(--t-high)" strokeWidth="2"
          strokeDasharray="135 405" strokeDashoffset="-270" opacity="0.45"
        />
        <circle
          cx="100" cy="100" r="86" fill="none"
          stroke="var(--t-crit)" strokeWidth="2"
          strokeDasharray="135 405" strokeDashoffset="-405" opacity="0.45"
        />
        <circle
          cx="100" cy="100" r="86" fill="none"
          stroke={activeColor} strokeWidth="14"
          strokeDasharray={`${dashLen} ${ARC_LENGTH}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="gauge-center">
        <div>
          <div className={`v ${valueClass}`}>{clamped}</div>
          <div className="of">/ 100 SCORE</div>
        </div>
      </div>
    </div>
  );
}
