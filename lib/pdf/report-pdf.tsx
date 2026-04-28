/* eslint-disable react/no-unknown-property */
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToStream,
} from '@react-pdf/renderer';
import type { RiskReport, Flag } from '../engine/types.js';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1a1a',
    padding: 36,
    lineHeight: 1.45,
  },
  h1: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 22,
    marginBottom: 4,
  },
  h2: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    marginTop: 18,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: '#888',
    paddingBottom: 4,
  },
  meta: {
    fontSize: 9,
    color: '#666',
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  scoreBox: {
    backgroundColor: '#fafaf7',
    borderWidth: 0.5,
    borderColor: '#888',
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  score: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 32,
  },
  scoreLabel: {
    fontSize: 9,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  verdict: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    padding: '4 8',
    borderWidth: 0.5,
    borderColor: '#888',
  },
  finding: {
    marginBottom: 12,
    padding: 10,
    borderWidth: 0.5,
    borderColor: '#bbb',
  },
  findingHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sevTag: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    padding: '2 6',
    backgroundColor: '#1a1a1a',
    color: '#fff',
    marginRight: 8,
    textTransform: 'uppercase',
  },
  typTag: {
    fontSize: 8,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  findingTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    marginBottom: 4,
  },
  findingBody: {
    fontSize: 10,
    color: '#333',
    marginBottom: 6,
  },
  evidenceTable: {
    marginTop: 4,
    marginBottom: 6,
  },
  evidenceRow: {
    flexDirection: 'row',
    fontSize: 8,
    fontFamily: 'Courier',
    color: '#555',
    paddingVertical: 2,
    borderBottomWidth: 0.25,
    borderBottomColor: '#ddd',
  },
  evidenceCol: { paddingRight: 6 },
  citation: {
    marginTop: 6,
    fontSize: 9,
    fontStyle: 'italic',
    color: '#444',
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#888',
  },
  citationTag: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: '#1a1a1a',
    fontStyle: 'normal',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    fontSize: 7,
    color: '#888',
    textAlign: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#bbb',
    paddingTop: 6,
  },
});

const VERDICT_LABEL: Record<string, string> = {
  low_risk: 'Low risk',
  standard_dd: 'Standard DD',
  enhanced_dd: 'Enhanced DD',
  escalate_to_mlro: 'Escalate · MLRO',
  block_or_offboard: 'Block / SAR',
};

function shortHash(h?: string): string {
  if (!h) return '—';
  if (h.length <= 14) return h;
  return `${h.slice(0, 8)}…${h.slice(-6)}`;
}

function formatEth(weiOrEth?: string | number): string {
  if (weiOrEth === undefined || weiOrEth === null) return '—';
  const n = typeof weiOrEth === 'string' ? Number(weiOrEth) : weiOrEth;
  if (!Number.isFinite(n)) return String(weiOrEth);
  if (Math.abs(n) >= 1e18) return `${(n / 1e18).toFixed(4)} ETH`;
  return `${n.toFixed(4)} ETH`;
}

function ReportDocument({ report }: { report: RiskReport }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>ChainSight AML Risk Report</Text>
        <Text style={styles.meta}>by AIRWA Finance · v{report.meta.chainsightVersion}</Text>

        <View style={styles.meta}>
          <View style={styles.metaRow}>
            <Text>Address</Text>
            <Text>{report.address}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text>Chain</Text>
            <Text>{report.chain}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text>Scanned at</Text>
            <Text>{report.scannedAt}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text>Total transactions</Text>
            <Text>{report.summary.totalTransactions}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text>Distinct counterparties</Text>
            <Text>{report.summary.distinctCounterparties}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text>First / last seen</Text>
            <Text>
              {(report.summary.firstSeen ?? '—').slice(0, 10)} / {(report.summary.lastSeen ?? '—').slice(0, 10)}
            </Text>
          </View>
        </View>

        <View style={styles.scoreBox}>
          <View>
            <Text style={styles.scoreLabel}>Composite risk score</Text>
            <Text style={styles.score}>{report.riskScore} / 100</Text>
          </View>
          <Text style={styles.verdict}>
            {VERDICT_LABEL[report.recommendation] ?? report.recommendation}
          </Text>
        </View>

        <Text style={styles.h2}>Findings ({report.flags.length})</Text>
        {report.flags.length === 0 && (
          <Text style={styles.findingBody}>
            No findings raised. All evaluated typologies returned clean.
          </Text>
        )}
        {report.flags.map((flag: Flag, i: number) => (
          <View key={i} style={styles.finding} wrap={false}>
            <View style={styles.findingHead}>
              <Text style={styles.sevTag}>{flag.severity}</Text>
              <Text style={styles.typTag}>{flag.typology}</Text>
            </View>
            <Text style={styles.findingTitle}>{flag.title}</Text>
            <Text style={styles.findingBody}>{flag.description}</Text>
            {flag.evidence.length > 0 && (
              <View style={styles.evidenceTable}>
                {flag.evidence.slice(0, 8).map((e, j) => (
                  <View key={j} style={styles.evidenceRow}>
                    <Text style={[styles.evidenceCol, { width: '20%' }]}>
                      {shortHash(e.txHash)}
                    </Text>
                    <Text style={[styles.evidenceCol, { width: '34%' }]}>
                      {e.counterpartyLabel
                        ? `${e.counterpartyLabel} (${shortHash(e.counterpartyAddress)})`
                        : shortHash(e.counterpartyAddress)}
                    </Text>
                    <Text style={[styles.evidenceCol, { width: '20%' }]}>
                      {formatEth(e.amountWei)}
                    </Text>
                    <Text style={[styles.evidenceCol, { width: '26%' }]}>
                      {(e.timestamp ?? '').slice(0, 16) || (e.note ?? '—')}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            {flag.citations.length > 0 && flag.citations[0] && (
              <View style={styles.citation}>
                <Text>
                  <Text style={styles.citationTag}>
                    {flag.citations[0].source}
                  </Text>
                  {'  '}
                  {flag.citations[0].reference}
                </Text>
              </View>
            )}
          </View>
        ))}

        <Text style={styles.h2}>Methodology + Sources</Text>
        <Text style={styles.findingBody}>
          ChainSight evaluates {report.meta.typologiesEvaluated.length} AML
          typologies (deterministic, fully open source). Each finding cites its
          regulatory source (FATF VA RFI 2020, OFAC SDN, EU CFSP, UK OFSI).
          Data sources used in this scan: {report.meta.dataSourcesUsed.join(', ')}.
        </Text>

        <Text style={styles.footer} fixed>
          ChainSight v{report.meta.chainsightVersion} · Rules{' '}
          {report.meta.rulesVersion} · fp:{report.meta.rulesFingerprint} ·
          AIRWA Finance · MIT License · Decision-support, analyst review
          required. Generated {new Date().toISOString().slice(0, 16)} UTC.
        </Text>
      </Page>
    </Document>
  );
}

export async function renderReportPdf(report: RiskReport): Promise<NodeJS.ReadableStream> {
  return await renderToStream(<ReportDocument report={report} />);
}
