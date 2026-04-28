interface Stat {
  num: string;
  unit: string;
  label: string;
  marker: string;
}

const STATS: Stat[] = [
  {
    num: '6',
    unit: 'chains',
    label: 'Ethereum · Polygon · BSC · Arbitrum · Base · Optimism',
    marker: '§I',
  },
  {
    num: '7',
    unit: 'typologies',
    label: 'Sanctions · Mixer · Scam · Layering · Peel · Counterparty · Dormant',
    marker: '§II',
  },
  {
    num: '100',
    unit: '%',
    label: 'Deterministic scoring · auditable',
    marker: '§III',
  },
  {
    num: '3',
    unit: 'formats',
    label: 'Markdown · JSON · PDF export',
    marker: '§IV',
  },
];

export function StatsStrip() {
  return (
    <section className="stats-strip">
      {STATS.map((s) => (
        <div className="stat-cell" key={s.marker}>
          <div className="stat-num">
            {s.num}
            <span>{s.unit}</span>
          </div>
          <div className="stat-lbl">{s.label}</div>
          <div className="chapter-marker">{s.marker}</div>
        </div>
      ))}
    </section>
  );
}
