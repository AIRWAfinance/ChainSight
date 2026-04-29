import type { Metadata } from 'next';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { FilmGrain } from '@/components/FilmGrain';

export const metadata: Metadata = {
  title: 'Pricing — ChainSight',
  description:
    'ChainSight pricing — €3,000/year locked-for-life design partner, €6,000 standard, €15,000 mid-market, €50,000+ enterprise. Honest tiers tied to product roadmap.',
};

interface Tier {
  name: string;
  price: string;
  cadence: string;
  ribbon?: string;
  highlight?: boolean;
  best: string;
  features: string[];
  cta: { label: string; href: string; primary?: boolean };
  unavailable?: string[];
}

const TIERS: Tier[] = [
  {
    name: 'Free design partner',
    price: '€0',
    cadence: 'months 1–3',
    best: 'First 3 partners only · signed pilot agreement',
    features: [
      'Every v0.7 feature',
      'Direct access to founder',
      'Onboarding + feedback calls included',
      'Public testimonial expected at end of pilot',
    ],
    cta: { label: 'Apply for design-partner pilot', href: 'mailto:cryptoworldinversiones@gmail.com?subject=ChainSight%20design%20partner%20application' },
  },
  {
    name: 'Design partner',
    price: '€3,000',
    cadence: '/ year',
    ribbon: 'Locked-for-life',
    highlight: true,
    best: 'Small EU CASPs, OAM/SEPBLAC-registered platforms',
    features: [
      '1 user',
      'Up to 20,000 scans / month',
      'All v0.7 features',
      'Free upgrade to v0.8 features as they ship',
      'Email support, 1-business-day response',
      'Locked-for-life — your price never increases',
    ],
    cta: { label: 'Subscribe via Stripe', href: '/pricing/checkout?tier=design-partner', primary: true },
  },
  {
    name: 'Standard CASP',
    price: '€6,000',
    cadence: '/ year',
    best: 'Mid-market CASPs, ETP issuers, B2B custodians',
    features: [
      '1–3 users',
      'Up to 50,000 scans / month',
      'Priority email support',
      'Quarterly compliance-review call',
    ],
    cta: { label: 'Subscribe via Stripe', href: '/pricing/checkout?tier=standard' },
  },
  {
    name: 'Mid-market',
    price: '€15,000',
    cadence: '/ year',
    best: 'Tier-1 EU CASPs, BaFin/MFSA-licensed exchanges',
    features: [
      '5 users',
      '100,000 scans / month',
      'Custom rule weights',
      'Multi-hop tracing v1',
      'SLA 99.5%',
      'Slack support channel',
    ],
    unavailable: ['Available after SOC 2 Type 1 attestation lands (Q4 2026)'],
    cta: { label: 'Talk to sales', href: 'mailto:cryptoworldinversiones@gmail.com?subject=ChainSight%20mid-market%20enquiry' },
  },
  {
    name: 'Enterprise',
    price: 'From €50,000',
    cadence: '/ year',
    best: 'Custodial banks, fund administrators, fintechs with crypto exposure',
    features: [
      'Unlimited users + scans',
      'SLA 99.9%',
      'Dedicated support engineer',
      'On-prem deployment option',
      'Travel Rule (FATF R.16) integration',
      'EU-only data residency contract',
    ],
    unavailable: ['Available after SOC 2 Type 2 + Travel Rule (H2 2027)'],
    cta: { label: 'Talk to sales', href: 'mailto:cryptoworldinversiones@gmail.com?subject=ChainSight%20enterprise%20enquiry' },
  },
];

interface Addon {
  label: string;
  price: string;
}

const ADDONS: Addon[] = [
  { label: 'Hosted EU-only deployment', price: '+€2,000/yr' },
  { label: 'Custom domain on the dashboard', price: '+€1,500/yr' },
  { label: 'White-label PDF report (your logo)', price: '+€2,500/yr' },
  { label: 'Dedicated Slack support channel', price: '+€3,000/yr' },
  { label: 'Quarterly compliance-review call', price: '+€2,000/yr' },
];

const ROADMAP_PRICES: Array<{ when: string; ships: string; price: string }> = [
  { when: 'Today', ships: 'v0.7.1 — current state', price: '€3,000 design partner' },
  { when: 'Q3 2026', ships: 'Multi-hop tracing v1, 50k entity labels', price: '€8,000 standard' },
  { when: 'Q4 2026', ships: 'SOC 2 Type 1 attestation', price: '€15,000 mid-market' },
  { when: 'H1 2027', ships: 'Cluster heuristics, cross-chain correlation', price: '€25,000 mid-market' },
  { when: 'H2 2027', ships: 'SOC 2 Type 2, Travel Rule v1', price: '€50,000+ enterprise' },
];

const COMPARES = [
  { vendor: 'Chainalysis Address Screening', price: '$25–35k/yr', note: 'Multi-chain, cluster heuristics, 10+ years of label data' },
  { vendor: 'Elliptic Lens', price: '$30–50k/yr', note: 'Wallet screening + cluster intelligence' },
  { vendor: 'TRM Labs', price: '$40–80k/yr', note: 'Strong on Travel Rule + real-time' },
  { vendor: 'OpenSanctions (data only)', price: 'free', note: 'Aggregator, not a screening product' },
  { vendor: 'ChainSight today', price: '€3,000/yr', note: 'Decision-support layer, citation-backed, MIT-licensed engine' },
];

export default function PricingPage() {
  return (
    <>
      <FilmGrain />
      <Nav />
      <main className="pricing-main">
        <section className="pricing-hero">
          <div className="kicker">§ Pricing · honest ladder</div>
          <h1>
            A fraction of the<br />
            incumbents. <em>On purpose.</em>
          </h1>
          <p className="lede">
            ChainSight is a decision-support layer that sits alongside your
            existing AML stack — not a replacement for Chainalysis,
            Elliptic, or TRM. We charge what we're worth today, with a
            transparent ladder tied to the product roadmap.
          </p>
        </section>

        <section className="pricing-tiers">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`tier ${tier.highlight ? 'tier-highlight' : ''}`}
            >
              {tier.ribbon && <div className="tier-ribbon">{tier.ribbon}</div>}
              <h3>{tier.name}</h3>
              <div className="tier-price">
                <span className="num">{tier.price}</span>
                <span className="cadence">{tier.cadence}</span>
              </div>
              <p className="tier-best">{tier.best}</p>
              <ul className="tier-feats">
                {tier.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              {tier.unavailable && (
                <div className="tier-pending">
                  {tier.unavailable.map((u) => (
                    <span key={u}>{u}</span>
                  ))}
                </div>
              )}
              <a
                href={tier.cta.href}
                className={tier.cta.primary ? 'btn-primary' : 'btn-secondary'}
              >
                {tier.cta.label}
              </a>
            </div>
          ))}
        </section>

        <section className="pricing-section">
          <h2>Add-ons</h2>
          <table className="pricing-table">
            <tbody>
              {ADDONS.map((a) => (
                <tr key={a.label}>
                  <td>{a.label}</td>
                  <td className="price">{a.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="pricing-section">
          <h2>Discounts</h2>
          <ul className="pricing-list">
            <li><b>Annual prepayment:</b> −10%</li>
            <li><b>3-year commit:</b> −20% with locked-for-life baseline price</li>
            <li><b>Reference customer:</b> free upgrade to next tier when ready, in exchange for a written + recorded testimonial</li>
          </ul>
        </section>

        <section className="pricing-section">
          <h2>How we compare</h2>
          <p className="lede small">
            Honest market comparables. We charge less because we explicitly
            do less in v0.7 — see the
            {' '}<Link href="/methodology/coverage">coverage &amp; scope</Link>
            {' '}page for the gap statement.
          </p>
          <table className="pricing-table compare">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Price</th>
                <th>What you get</th>
              </tr>
            </thead>
            <tbody>
              {COMPARES.map((c) => (
                <tr key={c.vendor} className={c.vendor === 'ChainSight today' ? 'us' : ''}>
                  <td><b>{c.vendor}</b></td>
                  <td className="price">{c.price}</td>
                  <td>{c.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="pricing-section">
          <h2>Roadmap-keyed price changes</h2>
          <p className="lede small">
            New baseline list price changes with each major milestone.
            <b> Your locked-for-life price never changes</b>, regardless of
            which milestone ships.
          </p>
          <table className="pricing-table">
            <thead>
              <tr>
                <th>When</th>
                <th>What ships</th>
                <th>New baseline list price</th>
              </tr>
            </thead>
            <tbody>
              {ROADMAP_PRICES.map((r) => (
                <tr key={r.when}>
                  <td className="when">{r.when}</td>
                  <td>{r.ships}</td>
                  <td className="price">{r.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="pricing-section">
          <h2>What we ask of design partners</h2>
          <p>
            In exchange for the €3,000 locked-for-life price (vs €15,000
            list once SOC 2 ships), we ask:
          </p>
          <ol className="pricing-list">
            <li>A 30-minute onboarding call so we understand your AML programme.</li>
            <li>A 30-minute feedback call every 60 days for the first year.</li>
            <li>A public testimonial (written + 2-min video) once the product has demonstrably helped your team. Negotiable timing.</li>
            <li>Honest bug reports when something breaks. Better signal beats vanity metrics.</li>
          </ol>
          <p>
            That's it. No exclusivity, no NDA on the tool itself (which is
            MIT-licensed), no penalty if you cancel.
          </p>
        </section>

        <section className="pricing-cta-bottom">
          <h2>Ready to apply?</h2>
          <p>Three design-partner slots remaining. After that, list price for the same tier becomes €8,000 in Q3 2026.</p>
          <div className="cta-row">
            <a className="btn-primary" href="mailto:cryptoworldinversiones@gmail.com?subject=ChainSight%20design%20partner%20application">
              Apply for design partner →
            </a>
            <Link className="btn-secondary" href="/methodology/coverage">
              Read coverage &amp; scope
            </Link>
            <Link className="btn-secondary" href="/trust">
              Read trust statement
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
