import type { Metadata } from 'next';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { FilmGrain } from '@/components/FilmGrain';

export const metadata: Metadata = {
  title: 'ChainSight — Trust & data handling',
  description:
    'Data residency, sub-processors, encryption, retention, and deletion-on-request for ChainSight. Procurement-ready trust statement for EU CASPs and regulated entities.',
};

interface SubProcessor {
  name: string;
  purpose: string;
  region: string;
  dpa: string;
}

const SUB_PROCESSORS: SubProcessor[] = [
  {
    name: 'Vercel, Inc.',
    purpose: 'Application hosting + serverless compute + cron',
    region: 'EU (fra1, cdg1) when configured; otherwise global edge',
    dpa: 'https://vercel.com/legal/dpa',
  },
  {
    name: 'Postgres provider (Neon / Supabase / Vercel Postgres)',
    purpose: 'Primary scan + audit storage when CHAINSIGHT_DB_URL is set',
    region: 'Customer-selected EU region',
    dpa: 'Per provider DPA — selected at deploy time',
  },
  {
    name: 'Etherscan / explorer V2 API',
    purpose: 'Public blockchain transaction history',
    region: 'Public data — no PII transmitted',
    dpa: 'No DPA required (public on-chain data)',
  },
  {
    name: 'Resend / SMTP provider',
    purpose: 'Watchlist score-change email alerts',
    region: 'Customer-selected EU region',
    dpa: 'Per provider DPA',
  },
  {
    name: 'GitHub, Inc.',
    purpose: 'Source code hosting (no customer data)',
    region: 'Global',
    dpa: 'https://github.com/customer-terms/github-data-protection-agreement',
  },
];

interface TrustRow {
  area: string;
  statement: string;
  evidence?: string;
}

const TRUST_ROWS: TrustRow[] = [
  {
    area: 'Data residency',
    statement:
      'Application + database deployable to EU regions only when configured (Vercel fra1/cdg1 + EU-region Postgres). The reference deployment runs in the EU; customers self-hosting can pin region in their Vercel project settings.',
    evidence: 'vercel.json + CHAINSIGHT_DB_URL env var',
  },
  {
    area: 'Encryption in transit',
    statement:
      'TLS 1.3 enforced at the Vercel edge. HSTS header sent on every response. No plaintext HTTP fallback.',
    evidence: 'middleware.ts response headers',
  },
  {
    area: 'Encryption at rest',
    statement:
      'Postgres provider AES-256 at-rest encryption (per Neon / Supabase / Vercel Postgres SOC2 attestations). Local SQLite (development only) is not encrypted — production deployments MUST use Postgres.',
  },
  {
    area: 'Authentication',
    statement:
      'Argon2-class bcrypt (cost 10) password hashing. Session JWT (HS256) with httpOnly + Secure + SameSite=Lax cookie. Login rate-limited to 5 attempts / 15 min / (IP + email). Failed login + rate-limit events written to immutable audit trail.',
    evidence: 'lib/auth/users.ts, lib/auth/rate-limit.ts',
  },
  {
    area: 'Audit trail',
    statement:
      'Immutable append-only audit log. Every login, scan, watchlist change, sanctions sync, and PDF export written with SHA-256 payload hash. Storage interface intentionally exposes append + list only — no update or delete.',
    evidence: 'lib/audit/, /api/audit/export',
  },
  {
    area: 'Rule-version pinning',
    statement:
      'Every saved scan records the SHA-256 fingerprint of the rule pack that produced it (severity weights, typology multipliers, detector tunables). A regulator can verify a historical report has not been altered and was produced by the rule version named in the PDF footer.',
    evidence: 'lib/engine/rules-version.ts, RiskReport.meta',
  },
  {
    area: 'Sanctions list freshness',
    statement:
      'OFAC / EU CFSP / UK OFSI / UN SC sanctions lists synced daily via Vercel Cron at 02:00 UTC. Each scan records `lastSyncedAt` per list; UI displays a red banner if any list is >24h stale. Regulators can verify the screening data version directly from the report.',
    evidence: '/api/sanctions/freshness, /api/cron/sync-sanctions',
  },
  {
    area: 'Retention',
    statement:
      'Saved scans, watchlist entries, and audit events retained for the EU AMLR-mandated 5 years from the date of the last customer activity. Configurable via deployment policy.',
    evidence: 'Storage retention policy (configurable)',
  },
  {
    area: 'Deletion on request',
    statement:
      'Customers may request deletion of their account, saved scans, and watchlist via Contact. Audit events are retained for the regulatory minimum even after account deletion (EU AMLR 5-year requirement) but are pseudonymised.',
  },
  {
    area: 'Sub-processor changes',
    statement:
      'Sub-processor list maintained on this page. Material changes notified to active customers 30 days in advance via email.',
  },
  {
    area: 'Incident response',
    statement:
      'Security incidents involving customer data notified to active customers within 72 hours of detection (GDPR Article 33 timeline). Postmortems published when not subject to ongoing investigation.',
  },
  {
    area: 'PII scope',
    statement:
      'Customer account email + bcrypt password hash. Scan inputs are public blockchain addresses — these are pseudonymous on-chain identifiers, not personal data in isolation. When customers link an address to a natural person via their internal CRM, that linkage stays in their system.',
  },
];

export default function TrustPage() {
  return (
    <>
      <FilmGrain />
      <Nav />
      <main className="trust-main">
        <section className="trust-hero">
          <div className="kicker">§V · Trust &amp; data handling</div>
          <h1>
            Built for compliance teams.<br />
            <em>Documented for procurement.</em>
          </h1>
          <p className="lede">
            ChainSight handles compliance-grade data flows — auth credentials,
            audit trails, sanctions evidence, scan reports. This page is the
            single source of truth for how we handle each one. Designed to
            answer the first round of any procurement security questionnaire
            before you ask.
          </p>
        </section>

        <section className="trust-grid-section">
          <h2>Controls in place today</h2>
          <div className="trust-grid">
            {TRUST_ROWS.map((row) => (
              <div className="trust-card" key={row.area}>
                <h3>{row.area}</h3>
                <p>{row.statement}</p>
                {row.evidence && (
                  <div className="evidence">
                    <span className="evidence-label">Evidence</span>
                    <code>{row.evidence}</code>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="trust-table-section">
          <h2>Sub-processors</h2>
          <p className="lede small">
            Third parties that process or store data on ChainSight's behalf.
            Material changes notified 30 days in advance.
          </p>
          <table className="trust-table">
            <thead>
              <tr>
                <th>Sub-processor</th>
                <th>Purpose</th>
                <th>Region</th>
                <th>DPA</th>
              </tr>
            </thead>
            <tbody>
              {SUB_PROCESSORS.map((p) => (
                <tr key={p.name}>
                  <td><b>{p.name}</b></td>
                  <td>{p.purpose}</td>
                  <td>{p.region}</td>
                  <td>
                    {p.dpa.startsWith('http') ? (
                      <a href={p.dpa} target="_blank" rel="noreferrer">
                        Link →
                      </a>
                    ) : (
                      <span className="muted">{p.dpa}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="trust-attestations">
          <h2>Attestations &amp; certifications</h2>
          <div className="att-grid">
            <div className="att-card pending">
              <div className="att-status">In progress</div>
              <h3>SOC 2 Type 1</h3>
              <p>Targeted Q3 2026. Required by procurement at most EU CASPs over €5M ARR.</p>
            </div>
            <div className="att-card not-started">
              <div className="att-status">Not started</div>
              <h3>SOC 2 Type 2</h3>
              <p>Targeted 12 months after Type 1 attestation.</p>
            </div>
            <div className="att-card not-started">
              <div className="att-status">Not started</div>
              <h3>ISO 27001</h3>
              <p>Considered after the first €100k ARR cohort. Will publish target date when committed.</p>
            </div>
            <div className="att-card own">
              <div className="att-status">Own</div>
              <h3>GDPR / EU AMLR readiness</h3>
              <p>DPIA template provided below for customer adaptation.</p>
            </div>
          </div>
        </section>

        <section className="trust-dpia">
          <h2>DPIA template</h2>
          <p className="lede small">
            Editable Markdown template you can fork and adapt for your own
            internal Data Protection Impact Assessment when adopting
            ChainSight. Provides the questions your DPO will ask and the
            ChainSight answer for each.
          </p>
          <div className="dpia-actions">
            <a
              className="btn-primary"
              href="/api/trust/dpia"
              download="ChainSight-DPIA-template.md"
            >
              Download DPIA template (.md)
            </a>
            <Link href="mailto:cryptoworldinversiones@gmail.com?subject=ChainSight%20procurement%20questions">
              <span className="btn-secondary">Email procurement questions</span>
            </Link>
          </div>
        </section>

        <section className="trust-disclaimer">
          <p>
            ChainSight is positioned as <em>decision-support</em>, not as a
            primary regulated control. See the
            {' '}<Link href="/methodology/coverage">coverage &amp; scope</Link>
            {' '}page for the explicit map of what ChainSight covers and what
            you must source elsewhere. Pair ChainSight with your existing
            sanctions vendor, KYC provider, and case-management system for a
            complete AML programme.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
