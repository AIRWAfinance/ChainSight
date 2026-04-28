interface Typology {
  num: string;
  name: string;
  title: string;
  body: string;
  source: string;
  ref: string;
}

const TYPOLOGIES: Typology[] = [
  {
    num: 'I.',
    name: 'Sanctions exposure',
    title: 'Direct counterparty screening',
    body: "Flags any transfer where the counterparty appears on OFAC's SDN list or sanctions registries from EU, UK, UN.",
    source: 'OFAC',
    ref: 'SDN · daily sync',
  },
  {
    num: 'II.',
    name: 'Mixer exposure',
    title: 'Privacy-tool flow tracing',
    body: 'Detects deposits to or withdrawals from known mixers — Tornado Cash, Sinbad, Wasabi — with value-weighted severity.',
    source: 'FATF',
    ref: 'RFI §3.1(b)',
  },
  {
    num: 'III.',
    name: 'Scam exposure',
    title: 'Curated cluster matching',
    body: 'Cross-references against known scam, drainer, ransomware, and rug-pull clusters with categorical severity.',
    source: 'FATF',
    ref: 'RFI §4.1',
  },
  {
    num: 'IV.',
    name: 'Layering',
    title: 'Pass-through pattern',
    body: 'Identifies inbound flows forwarded out within 60 minutes in near-identical amounts — classic placement-layering signature.',
    source: 'FATF',
    ref: 'RFI §4.2(a)',
  },
  {
    num: 'V.',
    name: 'Peel chain',
    title: 'Sequential decreasing outflows',
    body: 'Detects long chains of small outflows from a high-value source — a hallmark of structured crypto laundering.',
    source: 'FATF',
    ref: 'RFI §4.2(c)',
  },
];

export function Methodology() {
  return (
    <section id="methodology" className="section-meth">
      <div className="meth-head">
        <div className="kicker">§II · Methodology</div>
        <h2>
          Five typologies.<br />
          Five citations. <em>Zero black box.</em>
        </h2>
        <p className="lede">
          Each detector is a short, reviewable function — not a model. Results
          are reproducible across runs, and every finding is tied back to a
          specific regulatory source.
        </p>
      </div>
      <div id="typologies" className="typ-grid">
        {TYPOLOGIES.map((t) => (
          <div key={t.num} className="typ">
            <div className="num"><b>{t.num}</b> {t.name}</div>
            <h3>{t.title}</h3>
            <p>{t.body}</p>
            <div className="src"><b>{t.source}</b> {t.ref}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
