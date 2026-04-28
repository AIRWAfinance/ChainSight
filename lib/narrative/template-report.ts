import type { RiskReport, RiskRecommendation, Severity } from '../engine/types.js';

const RECOMMENDATION_LABELS: Record<RiskRecommendation, string> = {
  low_risk: 'LOW RISK — Standard onboarding sufficient',
  standard_dd: 'STANDARD DUE DILIGENCE — Routine CDD checks',
  enhanced_dd: 'ENHANCED DUE DILIGENCE — Apply EDD measures',
  escalate_to_mlro: 'ESCALATE TO MLRO — File internal SAR/STR review',
  block_or_offboard: 'BLOCK OR OFFBOARD — Sanctions exposure detected',
};

const SEVERITY_BADGE: Record<Severity, string> = {
  low: '[LOW]',
  medium: '[MEDIUM]',
  high: '[HIGH]',
  critical: '[CRITICAL]',
};

export function renderMarkdownReport(report: RiskReport): string {
  const lines: string[] = [];

  lines.push(`# ChainSight AML Risk Report`);
  lines.push('');
  lines.push(`**Address:** \`${report.address}\``);
  lines.push(`**Chain:** ${report.chain}`);
  lines.push(`**Scanned:** ${report.scannedAt}`);
  lines.push(`**ChainSight version:** ${report.meta.chainsightVersion}`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(`## Risk Score: ${report.riskScore} / 100`);
  lines.push('');
  lines.push(`**Recommendation:** ${RECOMMENDATION_LABELS[report.recommendation]}`);
  lines.push('');

  lines.push('## Summary');
  lines.push('');
  lines.push(`- Total transactions analysed: **${report.summary.totalTransactions}**`);
  lines.push(`- Distinct counterparties: **${report.summary.distinctCounterparties}**`);
  lines.push(`- First seen: ${report.summary.firstSeen ?? 'n/a'}`);
  lines.push(`- Last seen: ${report.summary.lastSeen ?? 'n/a'}`);
  lines.push(`- Typologies evaluated: ${report.meta.typologiesEvaluated.join(', ')}`);
  lines.push('');

  if (report.flags.length === 0) {
    lines.push('## Findings');
    lines.push('');
    lines.push('No AML typology flags raised against the configured rule set.');
    lines.push('');
    lines.push('> **Note:** Absence of flags does not guarantee the address is low-risk.');
    lines.push('> ChainSight v0.1 evaluates a limited set of typologies and address lists.');
    lines.push('> Manual review and additional tools (e.g. screening providers) remain necessary.');
    lines.push('');
  } else {
    lines.push(`## Findings (${report.flags.length})`);
    lines.push('');
    for (const flag of report.flags) {
      lines.push(`### ${SEVERITY_BADGE[flag.severity]} ${flag.title}`);
      lines.push('');
      lines.push(flag.description);
      lines.push('');
      lines.push('**Evidence:**');
      lines.push('');
      for (const ev of flag.evidence.slice(0, 10)) {
        lines.push(
          `- \`${ev.txHash ?? '(no hash)'}\` ${ev.note ?? ''} ${ev.timestamp ? `at ${ev.timestamp}` : ''}`.trim(),
        );
      }
      if (flag.evidence.length > 10) {
        lines.push(`- ...and ${flag.evidence.length - 10} more`);
      }
      lines.push('');
      lines.push('**Sources / Citations:**');
      lines.push('');
      for (const c of flag.citations) {
        lines.push(`- ${c.source}${c.reference ? ` — ${c.reference}` : ''}${c.url ? ` (${c.url})` : ''}`);
      }
      lines.push('');
    }
  }

  lines.push('---');
  lines.push('');
  lines.push('## Disclaimer');
  lines.push('');
  lines.push('This report is produced by ChainSight, an open-source AML research tool.');
  lines.push('It is provided for **educational and research purposes only** and does not');
  lines.push('constitute regulated AML advice or a sanctions-screening determination.');
  lines.push('Regulated entities must conduct their own due diligence using approved');
  lines.push('vendors and procedures.');
  lines.push('');
  lines.push(`Data sources used: ${report.meta.dataSourcesUsed.join(', ')}`);
  lines.push('');

  return lines.join('\n');
}
