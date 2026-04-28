import type { Metadata } from 'next';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { FilmGrain } from '@/components/FilmGrain';

export const metadata: Metadata = {
  title: 'ChainSight — Coverage & scope',
  description:
    'What ChainSight covers, what it does not, and what your AML programme must source elsewhere. Honest scope statement for compliance teams.',
};

interface ScopeRow {
  area: string;
  status: 'covered' | 'partial' | 'out_of_scope';
  detail: string;
  layerWith?: string;
}

const ROWS: ScopeRow[] = [
  {
    area: 'Wallet-level AML screening (EVM)',
    status: 'covered',
    detail:
      'Direct sanctions exposure, mixer exposure, scam-cluster matching, 5 FATF typologies (layering, peel chain, high-risk counterparty, dormant-active, scam). Citation per finding.',
  },
  {
    area: 'Sanctions sources',
    status: 'partial',
    detail:
      'OFAC SDN synced. EU Consolidated, UK OFSI, UN SC structures present but full automated sync is on the roadmap. Freshness banner exposed in UI.',
    layerWith: 'For now, treat ChainSight sanctions screening as complementary — pair with a regulated sanctions vendor for primary control.',
  },
  {
    area: 'Counterparty graph (1-hop)',
    status: 'covered',
    detail:
      'Top 30 counterparties by volume, with entity labels where available.',
  },
  {
    area: 'Multi-hop tracing (2+ hops)',
    status: 'out_of_scope',
    detail: 'On the roadmap (BFS depth-2). Not in v0.6.',
    layerWith: 'For complex investigations, layer with Chainalysis Reactor / Elliptic Investigator / TRM Forensics.',
  },
  {
    area: 'Cluster heuristics (common-input-ownership)',
    status: 'out_of_scope',
    detail: 'Each address evaluated independently. No address-clustering today.',
    layerWith: 'Same as above.',
  },
  {
    area: 'Cross-chain tracing',
    status: 'out_of_scope',
    detail:
      'Each scan evaluates a single chain. Cross-chain link discovery (ETH ↔ BSC ↔ Polygon ↔ Arbitrum ↔ Base ↔ Optimism via the same controller) is not automated.',
    layerWith: 'Vendor forensics tools, or roll-your-own correlation in your case-management system.',
  },
  {
    area: 'Token (ERC-20) scope inside detectors',
    status: 'partial',
    detail:
      'Sanctions / mixer / scam exposure evaluate ERC-20 transfers. Behavioural detectors (layering, peel chain) evaluate ETH only in v0.6.',
    layerWith: 'If your typology requires USDT/USDC behavioural tracking, flag it — it is the next detector upgrade on the roadmap.',
  },
  {
    area: 'Customer KYC (natural persons)',
    status: 'out_of_scope',
    detail:
      'ChainSight has no identity verification, document checking, biometric liveness, or PEP screening on natural persons.',
    layerWith: 'Sumsub, Onfido, Veriff, Jumio, ComplyAdvantage.',
  },
  {
    area: 'PEP & adverse-media screening',
    status: 'out_of_scope',
    detail: 'Wallet-only — names of natural persons are never seen by the engine.',
    layerWith: 'ComplyAdvantage, Refinitiv World-Check, Dow Jones Risk Center.',
  },
  {
    area: 'Travel Rule (FATF R.16 / EU TFR)',
    status: 'out_of_scope',
    detail:
      'No originator/beneficiary message exchange. EU TFR thresholds (≥€1000 from Dec 2024) are not handled by ChainSight.',
    layerWith: 'Notabene, Sumsub Travel Rule, TRP, Veriscope, 21 Travel Rule.',
  },
  {
    area: 'SAR / STR filing',
    status: 'out_of_scope',
    detail:
      'ChainSight produces a defensible PDF risk report suitable as an evidence pack inside your case file. It is NOT a SAR/STR filing system and does NOT produce goAML XML.',
    layerWith: 'Your existing FIU portal (goAML for most EU FIUs).',
  },
  {
    area: 'Customer-level risk aggregation',
    status: 'out_of_scope',
    detail:
      'Output is per-address. Rolling N addresses up to a single customer-risk-rating is your case-management system\'s responsibility.',
    layerWith: 'Your CRM / case-management layer.',
  },
  {
    area: 'Ongoing monitoring',
    status: 'covered',
    detail:
      'Watchlist endpoint with rescan + email alert on score change. Cadence is configurable.',
  },
  {
    area: 'Audit trail / record retention',
    status: 'partial',
    detail:
      'Scans persisted with timestamp + user. Immutable audit log + rule-version pinning per scan are on the v0.7 roadmap to meet EU AMLR 5-year retention defensibility.',
    layerWith: 'Until v0.7, retain your own copy of each scan PDF in your DMS.',
  },
];

const STATUS_LABEL: Record<ScopeRow['status'], string> = {
  covered: 'Covered',
  partial: 'Partial',
  out_of_scope: 'Out of scope',
};

export default function CoveragePage() {
  return (
    <>
      <FilmGrain />
      <Nav />
      <main className="coverage-main">
        <section className="coverage-hero">
          <div className="kicker">§II.b · Scope statement</div>
          <h1>
            What ChainSight <em>does</em>.<br />
            And what it <em>does not</em>.
          </h1>
          <p className="lede">
            Built by an AML practitioner, for AML practitioners. Below is the
            honest map of what ChainSight covers today, what is partial, and
            what your compliance programme must source from another vendor or
            internal control. Use it during procurement to scope the gap.
          </p>
        </section>

        <section className="coverage-table-section">
          <table className="coverage-table">
            <thead>
              <tr>
                <th>AML programme area</th>
                <th>ChainSight v0.6</th>
                <th>What this means</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.area} className={`row-${row.status}`}>
                  <td className="area">{row.area}</td>
                  <td className="status">
                    <span className={`pill pill-${row.status}`}>
                      {STATUS_LABEL[row.status]}
                    </span>
                  </td>
                  <td className="detail">
                    <p>{row.detail}</p>
                    {row.layerWith && (
                      <p className="layer-with">
                        <b>Layer with:</b> {row.layerWith}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="coverage-positioning">
          <div className="kicker">Positioning</div>
          <h2>
            ChainSight is decision-support,<br />
            <em>not a regulated control.</em>
          </h2>
          <p>
            ChainSight is a deterministic, citation-backed, address-level AML
            screening + transaction-monitoring engine for crypto compliance
            teams. It is designed to sit alongside your existing AML stack —
            not to replace your sanctions vendor, your KYC provider, or your
            case-management system.
          </p>
          <p>
            If a regulator audits your CASP tomorrow, ChainSight is the tool
            that lets your analyst show <em>why</em> a transaction was flagged
            — with the FATF / OFAC / EU citation attached — not the tool that
            files the SAR for you. We are explicit about that gap so you can
            scope it correctly during procurement.
          </p>
          <p className="cta-line">
            <Link href="/scan" className="btn-primary">Run a scan</Link>
            {' '}
            <Link href="/#methodology" className="btn-secondary">Read the methodology</Link>
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
