import nodemailer from 'nodemailer';
import type { RiskReport } from '../engine/types.js';

let cachedTransporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env['SMTP_HOST'];
  const port = Number(process.env['SMTP_PORT'] ?? '587');
  const user = process.env['SMTP_USER'];
  const pass = process.env['SMTP_PASS'];

  if (!host || !user || !pass) {
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return cachedTransporter;
}

interface AlertEmailOptions {
  to: string;
  address: string;
  chain: string;
  oldScore: number | null;
  newScore: number;
  delta: number | null;
  report: RiskReport;
}

export async function sendScoreAlert(opts: AlertEmailOptions): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('[email] SMTP not configured — skipping alert.');
    return false;
  }

  const from = process.env['SMTP_FROM'] ?? 'ChainSight <noreply@chainsight.local>';
  const baseUrl = process.env['CHAINSIGHT_BASE_URL'] ?? 'http://localhost:3000';

  const dirArrow =
    opts.delta === null
      ? ''
      : opts.delta > 0
        ? `↑ +${opts.delta}`
        : opts.delta < 0
          ? `↓ ${opts.delta}`
          : '=';

  const verdictMap: Record<string, string> = {
    low_risk: 'Low risk',
    standard_dd: 'Standard DD',
    enhanced_dd: 'Enhanced DD',
    escalate_to_mlro: 'Escalate · MLRO',
    block_or_offboard: 'Block / SAR',
  };
  const verdict = verdictMap[opts.report.recommendation] ?? opts.report.recommendation;
  const flagsList = opts.report.flags
    .map((f) => `  • [${f.severity.toUpperCase()}] ${f.title}`)
    .join('\n') || '  (no flags)';

  const subject = `ChainSight alert · ${opts.chain} ${shortAddr(opts.address)} · ${opts.newScore}/100 ${dirArrow}`;

  const text = `ChainSight risk alert
=====================

Wallet:        ${opts.address}
Chain:         ${opts.chain}
Previous score: ${opts.oldScore ?? '—'}
New score:      ${opts.newScore}/100 ${dirArrow}
Verdict:        ${verdict}

Active flags:
${flagsList}

Full report:
  ${baseUrl}/scan?address=${opts.address}&chain=${opts.chain}

This alert was sent because the wallet is on your ChainSight watchlist
and its risk score changed. Reply STOP to disable alerts for this wallet.`;

  const html = `
<!doctype html>
<html><body style="font-family: -apple-system, system-ui, sans-serif; color: #1a1a1a; max-width: 600px; margin: auto; padding: 24px;">
  <h1 style="font-size: 22px; margin: 0 0 8px;">ChainSight risk alert</h1>
  <p style="color: #666; margin: 0 0 24px;">A wallet on your watchlist changed risk score.</p>

  <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
    <tr><td style="padding: 6px 12px; background: #f5f3ee; font-weight: 600;">Wallet</td><td style="padding: 6px 12px; font-family: monospace;">${opts.address}</td></tr>
    <tr><td style="padding: 6px 12px; background: #f5f3ee; font-weight: 600;">Chain</td><td style="padding: 6px 12px;">${opts.chain}</td></tr>
    <tr><td style="padding: 6px 12px; background: #f5f3ee; font-weight: 600;">Previous score</td><td style="padding: 6px 12px;">${opts.oldScore ?? '—'}</td></tr>
    <tr><td style="padding: 6px 12px; background: #f5f3ee; font-weight: 600;">New score</td><td style="padding: 6px 12px;"><b style="font-size: 18px;">${opts.newScore}/100</b> ${dirArrow}</td></tr>
    <tr><td style="padding: 6px 12px; background: #f5f3ee; font-weight: 600;">Verdict</td><td style="padding: 6px 12px;">${verdict}</td></tr>
  </table>

  <h3 style="font-size: 16px; margin: 16px 0 8px;">Active flags</h3>
  <ul style="font-size: 14px; line-height: 1.6;">
${opts.report.flags.map((f) => `    <li><b>[${f.severity.toUpperCase()}]</b> ${escapeHtml(f.title)}</li>`).join('\n') || '    <li>(no flags)</li>'}
  </ul>

  <p style="margin-top: 24px;">
    <a href="${baseUrl}/scan?address=${opts.address}&chain=${opts.chain}"
       style="background: #d4a949; color: #1a1300; padding: 10px 16px; text-decoration: none; font-weight: 600; border-radius: 4px;">
      View full report →
    </a>
  </p>

  <p style="font-size: 12px; color: #888; margin-top: 32px; border-top: 1px solid #e5e5e5; padding-top: 16px;">
    Sent because this wallet is on your ChainSight watchlist.
  </p>
</body></html>`.trim();

  try {
    await transporter.sendMail({ from, to: opts.to, subject, text, html });
    return true;
  } catch (err) {
    console.error('[email] Send failed:', err);
    return false;
  }
}

interface BetaSignupPayload {
  email: string;
  role?: string;
  company?: string;
  notes?: string;
}

export async function sendBetaSignup(payload: BetaSignupPayload): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) return false;

  const inbox =
    process.env['BETA_INBOX_EMAIL'] ?? process.env['SMTP_USER'] ?? '';
  if (!inbox) return false;

  const from = process.env['SMTP_FROM'] ?? 'ChainSight <noreply@chainsight.local>';
  const subject = `New ChainSight beta signup: ${payload.email}`;
  const lines = [
    `Email:    ${payload.email}`,
    `Role:     ${payload.role ?? '—'}`,
    `Company:  ${payload.company ?? '—'}`,
    '',
    'Notes:',
    payload.notes ?? '(none)',
    '',
    `Received: ${new Date().toISOString()}`,
  ];

  try {
    await transporter.sendMail({
      from,
      to: inbox,
      replyTo: payload.email,
      subject,
      text: lines.join('\n'),
    });
    return true;
  } catch (err) {
    console.error('[beta-notify] send failed:', err);
    return false;
  }
}

function shortAddr(s: string): string {
  return s.length <= 12 ? s : `${s.slice(0, 6)}…${s.slice(-4)}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
