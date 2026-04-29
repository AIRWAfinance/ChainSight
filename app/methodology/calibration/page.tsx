import type { Metadata } from 'next';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { FilmGrain } from '@/components/FilmGrain';
import {
  RULES_VERSION,
  RULES_FINGERPRINT,
} from '@/lib/engine/rules-version';

export const metadata: Metadata = {
  title: 'ChainSight — Risk score calibration',
  description:
    'How ChainSight severity weights and typology multipliers were calibrated. Public references, design rationale, and the scoring math behind every report.',
};

interface SeverityRow {
  severity: 'low' | 'medium' | 'high' | 'critical';
  weight: number;
  rationale: string;
  example: string;
}

const SEVERITY: SeverityRow[] = [
  {
    severity: 'low',
    weight: 5,
    rationale:
      'Information-only signal. On its own, would not change a compliance officer\'s decision. Multiple low signals together can lift a score into "standard DD".',
    example: 'A single small mixer-adjacent transaction from years ago.',
  },
  {
    severity: 'medium',
    weight: 15,
    rationale:
      '3× a low signal. Roughly the threshold at which an analyst should review the flag in context but not yet escalate.',
    example: 'Layering pattern with 3–9 rapid pass-through transactions.',
  },
  {
    severity: 'high',
    weight: 30,
    rationale:
      '2× medium / 6× low. Strong indicator that a senior reviewer should look. Two unrelated high findings push the score above 60 = "enhanced DD".',
    example: 'Direct mixer interaction ≥ 1 ETH but < 10 ETH.',
  },
  {
    severity: 'critical',
    weight: 60,
    rationale:
      '2× high / 12× low. A single critical alone (× a 1.5 typology multiplier) yields 90 points = "escalate to MLRO" tier. By design, one critical finding is enough to demand human review.',
    example: 'Direct transaction with an OFAC SDN-listed address.',
  },
];

interface TypologyRow {
  typology: string;
  multiplier: number;
  rationale: string;
}

const TYPOLOGIES: TypologyRow[] = [
  {
    typology: 'sanctions_exposure',
    multiplier: 1.5,
    rationale:
      'Strict-liability risk under OFAC, EU CFSP, UK OFSI, UN SC. Direct exposure is the single highest-impact finding a compliance team can encounter — there is no "intent" defence. The 50% premium over the base severity weight reflects this strict-liability nature.',
  },
  {
    typology: 'mixer_exposure',
    multiplier: 1.3,
    rationale:
      'FATF VA RFI 2020 §3.1(b) flags mixer use as a strong ML indicator. FinCEN FIN-2019-A003 advisory specifically calls out privacy mixers. The 30% premium reflects regulatory consensus that mixer use without legitimate explanation is a substantive red flag.',
  },
  {
    typology: 'scam_exposure',
    multiplier: 1.2,
    rationale:
      'Curated cluster matching against known scams, drainers, and ransomware addresses. 20% premium because attribution of an address to a specific scam cluster carries some uncertainty (vs. sanctions, which is binary).',
  },
  {
    typology: 'high_risk_counterparty',
    multiplier: 1.1,
    rationale:
      'Concentrated value flow (≥70% to a small set of peers) is a classic mule/controlled-counterparty signature (FATF VA RFI 2020 §3.3). Modest 10% premium because the same pattern can appear in legitimate B2B settlement flows.',
  },
  {
    typology: 'layering',
    multiplier: 1.0,
    rationale:
      'Pass-through pattern (FATF VA RFI 2020 §4.2(a)). No premium or discount — this is the baseline behavioural detector against which others are scaled. Multi-window: matches in ≤15min get high severity, ≤1h get medium, ≤24h get low. Critical-tier triggers at ≥25 matches OR ≥100 ETH-equivalent (or ≥100k stablecoin USD). ERC-20 grouped per token contract — ETH layering and USDT layering on the same address produce two separate findings.',
  },
  {
    typology: 'peel_chain',
    multiplier: 1.0,
    rationale:
      'Sequential decreasing outflows (FATF VA RFI 2020 §4.2(c)). Same baseline reasoning as layering.',
  },
  {
    typology: 'dormant_active',
    multiplier: 0.9,
    rationale:
      '10% discount because legitimate cold-wallet reactivation is common (e.g. long-term holders moving funds to upgraded wallets) and produces a high false-positive rate on its own. Best used as a corroborating signal alongside other findings.',
  },
];

interface VerdictRow {
  threshold: string;
  recommendation: string;
  description: string;
}

const VERDICTS: VerdictRow[] = [
  {
    threshold: '< 15',
    recommendation: 'Low risk',
    description: 'Baseline customer due diligence sufficient.',
  },
  {
    threshold: '15 – 39',
    recommendation: 'Standard DD',
    description: 'Standard customer due diligence.',
  },
  {
    threshold: '40 – 74',
    recommendation: 'Enhanced DD',
    description: 'Enhanced due diligence per AMLD Article 18.',
  },
  {
    threshold: '≥ 75',
    recommendation: 'Escalate to MLRO',
    description:
      'Tier triggered by score, OR by sanctions+critical combination regardless of score.',
  },
  {
    threshold: 'Sanctions + critical',
    recommendation: 'Block / SAR',
    description:
      'Strict-liability override — direct sanctions exposure plus any critical finding goes straight to MLRO regardless of composite score.',
  },
];

const REFERENCES = [
  {
    name: 'FATF — Virtual Assets Red Flag Indicators',
    year: 'September 2020',
    url: 'https://www.fatf-gafi.org/publications/fatfrecommendations/documents/Virtual-Assets-Red-Flag-Indicators.html',
    used: 'Severity tiering for layering, peel-chain, mixer-exposure, high-risk-counterparty.',
  },
  {
    name: 'FATF — Updated Guidance for VAs and VASPs',
    year: 'October 2021',
    url: 'https://www.fatf-gafi.org/publications/fatfrecommendations/documents/Updated-Guidance-VA-VASP.html',
    used: 'Sanctions-screening obligation (§87), risk-based approach principles.',
  },
  {
    name: 'FinCEN Advisory FIN-2019-A003',
    year: 'May 2019',
    url: 'https://www.fincen.gov/sites/default/files/advisory/2019-05-10/FinCEN%20Advisory%20CVC%20FINAL%20508.pdf',
    used: 'Mixer + privacy-coin indicators, scam cluster typology.',
  },
  {
    name: 'FinCEN Advisory FIN-2020-A006',
    year: 'October 2020',
    url: 'https://www.fincen.gov/sites/default/files/advisory/2020-10-01/Advisory%20Ransomware%20FINAL%20508.pdf',
    used: 'Ransomware payment patterns, scam_exposure severity.',
  },
  {
    name: 'OFAC SDN List',
    year: 'Live feed',
    url: 'https://ofac.treasury.gov/specially-designated-nationals-and-blocked-persons-list-sdn-human-readable-lists',
    used: 'Strict-liability sanctions baseline (1.5× multiplier rationale).',
  },
  {
    name: 'EBA Guidelines on customer due diligence factors',
    year: 'March 2021',
    url: 'https://www.eba.europa.eu/regulation-and-policy/anti-money-laundering-and-countering-financing-terrorism/guidelines-on-money-laundering-and-terrorist-financing-risk-factors',
    used: 'Verdict-tier mapping (Standard / Enhanced DD thresholds).',
  },
];

export default function CalibrationPage() {
  return (
    <>
      <FilmGrain />
      <Nav />
      <main className="calib-main">
        <section className="calib-hero">
          <div className="kicker">§II.c · Score calibration</div>
          <h1>
            How the score<br />
            is <em>actually</em> built.
          </h1>
          <p className="lede">
            Every ChainSight score is the result of an explicit, deterministic
            formula. No ML, no opaque blending. This page documents every
            number an analyst or regulator might ask about — and the public
            FATF / FinCEN / OFAC / EBA reference behind each design choice.
          </p>
          <div className="calib-version">
            <div>
              <span className="lbl">Active rules</span>
              <span className="val">{RULES_VERSION}</span>
            </div>
            <div>
              <span className="lbl">Fingerprint</span>
              <span className="val mono">{RULES_FINGERPRINT}</span>
            </div>
            <div>
              <span className="lbl">Last revision</span>
              <span className="val">2026-04-29</span>
            </div>
          </div>
        </section>

        <section className="calib-formula">
          <h2>The formula in one line</h2>
          <pre className="formula">
{`score = min(100, round(
  Σ over each finding F of [ severity_weight(F) × typology_multiplier(F) ]
))`}
          </pre>
          <p>
            Capped at 100 for reporting; the uncapped raw is preserved in
            <code> RiskReport.scoreBreakdown</code> so a regulator can see
            extreme cases that exceed 100.
          </p>
        </section>

        <section className="calib-table-section">
          <h2>Severity weights</h2>
          <table className="calib-table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Weight</th>
                <th>Rationale</th>
                <th>Example</th>
              </tr>
            </thead>
            <tbody>
              {SEVERITY.map((row) => (
                <tr key={row.severity}>
                  <td><span className={`sev-pill sev-${row.severity}`}>{row.severity}</span></td>
                  <td className="num"><b>{row.weight}</b></td>
                  <td>{row.rationale}</td>
                  <td className="muted">{row.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="note">
            Weights are geometric: each tier doubles or triples its predecessor.
            This means combining a critical with three lows still ranks above
            two unrelated highs — by design, one critical dominates.
          </p>
        </section>

        <section className="calib-table-section">
          <h2>Typology multipliers</h2>
          <table className="calib-table">
            <thead>
              <tr>
                <th>Typology</th>
                <th>Multiplier</th>
                <th>Rationale</th>
              </tr>
            </thead>
            <tbody>
              {TYPOLOGIES.map((row) => (
                <tr key={row.typology}>
                  <td className="mono">{row.typology}</td>
                  <td className="num"><b>×{row.multiplier.toFixed(1)}</b></td>
                  <td>{row.rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="calib-table-section">
          <h2>Verdict tiers</h2>
          <table className="calib-table">
            <thead>
              <tr>
                <th>Score range</th>
                <th>Recommendation</th>
                <th>Meaning</th>
              </tr>
            </thead>
            <tbody>
              {VERDICTS.map((row) => (
                <tr key={row.threshold}>
                  <td className="num"><b>{row.threshold}</b></td>
                  <td><span className="verdict-pill">{row.recommendation}</span></td>
                  <td>{row.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="calib-defensibility">
          <h2>Why this calibration is defensible</h2>
          <ol>
            <li>
              <b>Deterministic.</b> The same address with the same on-chain
              history produces the same score on every run, until the rule
              version changes — at which point the new fingerprint is recorded
              in every PDF.
            </li>
            <li>
              <b>Reviewable.</b> The complete weight table and multiplier
              table are above. Every detector is a short, named function in
              <code> lib/typologies/</code>. There is no opaque ensemble
              learned from a private dataset.
            </li>
            <li>
              <b>Cited.</b> Every finding emitted by a detector includes a
              FATF / FinCEN / OFAC / EU citation. A regulator can trace a
              score line back to the public document that justifies it.
            </li>
            <li>
              <b>Pinned.</b> Each saved scan stores
              <code> rulesVersion</code> and a SHA-256
              <code> rulesFingerprint</code>. Re-running the same scan one
              year from now against the same rule version produces the same
              score; if the rules have changed, that fact is visible.
            </li>
            <li>
              <b>Capped &amp; uncapped both retained.</b> The reported 0–100
              score is for analyst UX. The uncapped per-typology raw points
              are kept in
              <code> RiskReport.scoreBreakdown</code> so extreme cases are
              not flattened.
            </li>
          </ol>
        </section>

        <section className="calib-limitations">
          <h2>Honest limitations</h2>
          <ul>
            <li>
              The current weight set was chosen by a human practitioner
              (AML/CDD Team Leader, ICA Advanced AML) reading the public
              guidance, not by fitting against a labelled dataset of
              confirmed laundering cases. v0.8 will publish a calibration
              study against the public Elliptic and Chainalysis datasets.
            </li>
            <li>
              Multipliers are constant across chains. Empirically, mixer
              exposure on Ethereum and BSC may carry different base rates;
              chain-specific calibration is on the roadmap.
            </li>
            <li>
              The composite score does not encode time-decay. A 5-year-old
              mixer interaction is weighted equally with a yesterday
              interaction. Time-decay is a v0.8 candidate.
            </li>
          </ul>
        </section>

        <section className="calib-references">
          <h2>Public references</h2>
          <ul className="ref-list">
            {REFERENCES.map((r) => (
              <li key={r.name}>
                <a href={r.url} target="_blank" rel="noreferrer">
                  <b>{r.name}</b>
                </a>
                <span className="ref-year">{r.year}</span>
                <p>{r.used}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="calib-footer-cta">
          <p>
            Looking for the broader scope statement, the trust page, or a
            DPIA template?
          </p>
          <div className="cta-row">
            <Link href="/methodology/coverage" className="btn-secondary">Coverage &amp; scope</Link>
            <Link href="/trust" className="btn-secondary">Trust &amp; data handling</Link>
            <Link href="/scan" className="btn-primary">Run a scan</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
