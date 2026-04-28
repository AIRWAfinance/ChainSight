'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type {
  SavedScanSummary,
  WatchlistEntry,
} from '@/lib/storage';

function shortAddr(s: string): string {
  if (!s || s.length <= 12) return s;
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
}

function scoreClass(score: number): string {
  if (score >= 75) return 'crit';
  if (score >= 50) return 'high';
  if (score >= 25) return '';
  return 'low';
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return iso.replace('T', ' ').slice(0, 16) + ' UTC';
}

interface RescanResult {
  watchId: string;
  address: string;
  ok: boolean;
  oldScore: number | null;
  newScore: number | null;
  delta: number | null;
  error?: string;
}

export function Dashboard() {
  const [scans, setScans] = useState<SavedScanSummary[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescanRunning, setRescanRunning] = useState(false);
  const [rescanStatus, setRescanStatus] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [s, w] = await Promise.all([
        fetch('/api/scans').then((r) => r.json()),
        fetch('/api/watchlist').then((r) => r.json()),
      ]);
      setScans(s.scans ?? []);
      setWatchlist(w.watchlist ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function deleteScan(id: string) {
    if (!confirm('Delete this saved scan?')) return;
    await fetch(`/api/scans/${id}`, { method: 'DELETE' });
    refresh();
  }

  async function removeWatch(id: string) {
    if (!confirm('Remove this address from your watchlist?')) return;
    await fetch(`/api/watchlist/${id}`, { method: 'DELETE' });
    refresh();
  }

  async function rescanAll() {
    if (watchlist.length === 0) return;
    setRescanRunning(true);
    setRescanStatus(`Rescanning ${watchlist.length} watched addresses…`);
    try {
      const res = await fetch('/api/watchlist/rescan', { method: 'POST' });
      const json = await res.json();
      const results: RescanResult[] = json.results ?? [];
      const okCount = results.filter((r) => r.ok).length;
      const movers = results.filter((r) => r.ok && r.delta !== null && r.delta !== 0).length;
      setRescanStatus(`Done. ${okCount}/${results.length} scanned · ${movers} score changes.`);
    } catch (err: unknown) {
      setRescanStatus(`Failed: ${err instanceof Error ? err.message : 'unknown error'}`);
    } finally {
      setRescanRunning(false);
      refresh();
    }
  }

  return (
    <section className="dashboard">
      <div className="kicker">§ Operator dashboard</div>
      <h1>Saved scans <em>&amp; watchlist.</em></h1>
      <p className="lede">
        ChainSight stores your saved scans and watched addresses locally on
        the host running this app (SQLite). Manual rescan re-runs the engine
        on every active watchlist entry and records the new score delta.
      </p>

      {/* WATCHLIST */}
      <h2>
        <span>Watchlist</span>
        <span className="count">{watchlist.length} active</span>
      </h2>

      {loading ? (
        <div className="empty">Loading…</div>
      ) : watchlist.length === 0 ? (
        <div className="empty">
          No watched addresses yet. Run a scan and click <b>Add to watchlist</b>.
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Address</th>
              <th>Chain</th>
              <th>Last score</th>
              <th>Last checked</th>
              <th>Alerts to</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {watchlist.map((w) => (
              <tr key={w.id}>
                <td>{shortAddr(w.address)}</td>
                <td>{w.chain}</td>
                <td>
                  {w.lastSeenScore !== null ? (
                    <span className={`score-pill ${scoreClass(w.lastSeenScore)}`}>
                      {w.lastSeenScore}/100
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td>{fmtDate(w.lastCheckedAt)}</td>
                <td>{w.alertEmail ?? <span style={{ color: 'var(--paper-muted)' }}>—</span>}</td>
                <td className="row-actions">
                  <Link
                    href={`/scan?address=${w.address}&chain=${w.chain}`}
                    className="btn-line"
                    style={{ fontSize: '0.72rem', padding: '0.4rem 0.7rem' }}
                  >
                    Rescan
                  </Link>
                  <button
                    type="button"
                    className="btn-line"
                    style={{ fontSize: '0.72rem', padding: '0.4rem 0.7rem' }}
                    onClick={() => removeWatch(w.id)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {watchlist.length > 0 && (
        <div className="toolbar">
          <button
            type="button"
            className="btn-gold"
            onClick={rescanAll}
            disabled={rescanRunning}
          >
            {rescanRunning ? 'Rescanning…' : 'Rescan all watched'}
          </button>
          {rescanStatus && (
            <span className="toolbar-status">{rescanStatus}</span>
          )}
        </div>
      )}

      {/* SAVED SCANS */}
      <h2>
        <span>Saved scans</span>
        <span className="count">{scans.length} total</span>
      </h2>

      {loading ? (
        <div className="empty">Loading…</div>
      ) : scans.length === 0 ? (
        <div className="empty">
          No saved scans yet. Run a scan and click <b>Save report</b> on the result.
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Address</th>
              <th>Chain</th>
              <th>Score</th>
              <th>Verdict</th>
              <th>Flags</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {scans.map((s) => (
              <tr key={s.id}>
                <td>{fmtDate(s.scannedAt)}</td>
                <td>{shortAddr(s.address)}</td>
                <td>{s.chain}</td>
                <td>
                  <span className={`score-pill ${scoreClass(s.riskScore)}`}>
                    {s.riskScore}/100
                  </span>
                </td>
                <td>{s.recommendation}</td>
                <td>{s.flagsCount}</td>
                <td className="row-actions">
                  <a
                    href={`/api/scans/${s.id}/pdf`}
                    className="btn-gold"
                    style={{ fontSize: '0.72rem', padding: '0.4rem 0.7rem' }}
                    download
                  >
                    PDF
                  </a>
                  <Link
                    href={`/scan?address=${s.address}&chain=${s.chain}`}
                    className="btn-line"
                    style={{ fontSize: '0.72rem', padding: '0.4rem 0.7rem' }}
                  >
                    Rescan
                  </Link>
                  <button
                    type="button"
                    className="btn-line"
                    style={{ fontSize: '0.72rem', padding: '0.4rem 0.7rem' }}
                    onClick={() => deleteScan(s.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
