import type { RiskReport } from '@/lib/engine/types';
import { RiskGauge } from './RiskGauge';
import {
  ThresholdLadder,
  recommendationLabel,
  recommendationProse,
} from './ThresholdLadder';
import { Findings } from './Findings';
import { ScoreBreakdown } from './ScoreBreakdown';
import { SaveActions } from './SaveActions';
import { CounterpartyGraph } from './CounterpartyGraph';

interface ReportProps {
  report: RiskReport;
  variant?: 'sample' | 'live';
}

function shortDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return iso.slice(0, 10);
}

export function Report({ report, variant = 'live' }: ReportProps) {
  const isCrit = report.recommendation === 'block_or_offboard'
    || report.recommendation === 'escalate_to_mlro';

  return (
    <>
      <section
        id={variant === 'sample' ? 'sample-report' : undefined}
        className="section-report"
      >
        <div className="report-head">
          <div>
            <div className="kicker">
              {variant === 'sample' ? '§III · Specimen report' : '§ Risk report'}
            </div>
            <h2>
              Wallet <em>{report.address.slice(0, 6)}…{report.address.slice(-4)}</em>
            </h2>
            <div className="addr-block">{report.address}</div>
          </div>
          <div className="meta">
            <span><b>{report.summary.totalTransactions}</b> TX</span>
            <span><b>{report.summary.distinctCounterparties}</b> COUNTERPARTIES</span>
            <span><b>{shortDate(report.summary.firstSeen)}</b> FIRST</span>
            <span><b>{shortDate(report.summary.lastSeen)}</b> LAST</span>
          </div>
        </div>

        <div className="report-grid">
          <div className="scorepanel">
            <div className="lbl">Composite risk score</div>
            <RiskGauge score={report.riskScore} />
            <ThresholdLadder score={report.riskScore} />
            <ScoreBreakdown
              breakdown={report.scoreBreakdown}
              total={report.riskScore}
            />
            <div className="verdict">
              <span className={`verdict-tag${isCrit ? ' crit' : ''}`}>
                {recommendationLabel(report.recommendation)}
              </span>
              <p>{recommendationProse(report.recommendation)}</p>
            </div>
            {variant === 'live' && <SaveActions report={report} />}
          </div>

          <Findings flags={report.flags} />
        </div>
      </section>

      {report.graph && report.graph.nodes.length > 1 && (
        <section className="graph-section">
          <h2>
            <span>Counterparty <em>graph.</em></span>
            <span className="count">
              {report.graph.nodes.length - 1} peers · 1-hop · top by ETH volume
            </span>
          </h2>
          <CounterpartyGraph graph={report.graph} />
        </section>
      )}
    </>
  );
}
