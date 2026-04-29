'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { SavedScanSummary } from '@/lib/storage';

type Severity = 'critical' | 'high' | 'medium';

interface Alert {
  scan: SavedScanSummary;
  severity: Severity;
}

const ALERT_THRESHOLD = 50;

function shortAddr(s: string): string {
  if (!s || s.length <= 12) return s;
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return iso.replace('T', ' ').slice(0, 16) + ' UTC';
}

function severityFor(score: number): Severity | null {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  return null;
}

function severityLabel(sev: Severity): string {
  switch (sev) {
    case 'critical':
      return 'Critical';
    case 'high':
      return 'High';
    case 'medium':
      return 'Medium';
  }
}

export function AlertsView(): React.ReactElement {
  const [scans, setScans] = useState<SavedScanSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/scans');
      const json = (await res.json()) as { scans?: SavedScanSummary[] };
      setScans(json.scans ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const alerts: Alert[] = scans
    .filter((s) => s.riskScore >= ALERT_THRESHOLD)
    .map((s) => {
      const sev = severityFor(s.riskScore);
      // sev is non-null because we filtered >= ALERT_THRESHOLD (50)
      return { scan: s, severity: sev ?? 'high' };
    })
    .sort((a, b) => b.scan.riskScore - a.scan.riskScore);

  const counts = {
    critical: alerts.filter((a) => a.severity === 'critical').length,
    high: alerts.filter((a) => a.severity === 'high').length,
  };

  return (
    <section className="dashboard alerts-page">
      <div className="kicker">§ Alerts</div>
      <h1>
        Active <em>alerts.</em>
      </h1>
      <p className="lede">
        Saved scans whose composite risk score crossed the Enhanced-DD
        threshold ({ALERT_THRESHOLD}+/100). Critical (75+) require immediate
        review and may trigger SAR filing under your compliance policy.
      </p>

      <h2>
        <span>Open alerts</span>
        <span className="count">
          {counts.critical} critical · {counts.high} high
        </span>
      </h2>

      {loading ? (
        <div className="empty">Loading…</div>
      ) : alerts.length === 0 ? (
        <div className="empty">
          No active alerts. All saved scans are below the {ALERT_THRESHOLD}
          /100 threshold.
        </div>
      ) : (
        <ul className="alert-list" aria-label="Active alerts">
          {alerts.map(({ scan, severity }) => (
            <li key={scan.id} className={`alert-item alert-${severity}`}>
              <div className="alert-pip" aria-hidden="true" />
              <div className="alert-body">
                <div className="alert-head">
                  <span className={`alert-sev sev-${severity}`}>
                    {severityLabel(severity)}
                  </span>
                  <span className="alert-meta">
                    <span className="mono">{shortAddr(scan.address)}</span>
                    <span>·</span>
                    <span>{scan.chain}</span>
                    <span>·</span>
                    <span>{fmtDate(scan.scannedAt)}</span>
                  </span>
                </div>
                <p className="alert-title">
                  Score <b>{scan.riskScore}/100</b>
                  {scan.flagsCount > 0 && (
                    <>
                      {' · '}
                      <span>
                        {scan.flagsCount} flag{scan.flagsCount === 1 ? '' : 's'}
                      </span>
                    </>
                  )}
                  {' · '}
                  <span style={{ color: 'var(--paper-muted)' }}>
                    {scan.recommendation}
                  </span>
                </p>
                <div className="alert-actions">
                  <Link
                    href={`/scan?address=${scan.address}&chain=${scan.chain}`}
                    className="btn-line"
                    style={{ fontSize: '0.72rem', padding: '0.4rem 0.7rem' }}
                  >
                    View / rescan
                  </Link>
                  <a
                    href={`/api/scans/${scan.id}/pdf`}
                    className="btn-gold"
                    style={{ fontSize: '0.72rem', padding: '0.4rem 0.7rem' }}
                    download
                  >
                    PDF report
                  </a>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
