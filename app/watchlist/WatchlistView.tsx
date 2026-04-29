'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { WatchlistEntry } from '@/lib/storage';

interface RescanResult {
  watchId: string;
  address: string;
  ok: boolean;
  oldScore: number | null;
  newScore: number | null;
  delta: number | null;
  error?: string;
}

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

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Unexpected error';
}

export function WatchlistView(): React.ReactElement {
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescanRunning, setRescanRunning] = useState(false);
  const [rescanStatus, setRescanStatus] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/watchlist');
      const json = (await res.json()) as { watchlist?: WatchlistEntry[] };
      setWatchlist(json.watchlist ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function removeWatch(id: string): Promise<void> {
    if (!confirm('Remove this address from your watchlist?')) return;
    await fetch(`/api/watchlist/${id}`, { method: 'DELETE' });
    refresh();
  }

  async function rescanAll(): Promise<void> {
    if (watchlist.length === 0) return;
    setRescanRunning(true);
    setRescanStatus(`Rescanning ${watchlist.length} watched addresses…`);
    try {
      const res = await fetch('/api/watchlist/rescan', { method: 'POST' });
      const json = (await res.json()) as { results?: RescanResult[] };
      const results = json.results ?? [];
      const okCount = results.filter((r) => r.ok).length;
      const movers = results.filter(
        (r) => r.ok && r.delta !== null && r.delta !== 0,
      ).length;
      setRescanStatus(
        `Done. ${okCount}/${results.length} scanned · ${movers} score changes.`,
      );
    } catch (err: unknown) {
      setRescanStatus(`Failed: ${getErrorMessage(err)}`);
    } finally {
      setRescanRunning(false);
      refresh();
    }
  }

  const activeCount = watchlist.filter((w) => w.status === 'active').length;

  return (
    <section className="dashboard">
      <div className="kicker">§ Watchlist</div>
      <h1>
        Watched <em>addresses.</em>
      </h1>
      <p className="lede">
        Addresses you've added to your watchlist. Manual rescan re-runs the
        engine on every active entry and records the new score delta.
      </p>

      <h2>
        <span>Active watchlist</span>
        <span className="count">
          {activeCount} active · {watchlist.length} total
        </span>
      </h2>

      {loading ? (
        <div className="empty">Loading…</div>
      ) : watchlist.length === 0 ? (
        <div className="empty">
          No watched addresses yet. Run a scan and click <b>Add to watchlist</b>
          on the result.
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Address</th>
              <th>Chain</th>
              <th>Status</th>
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
                <td>{w.status}</td>
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
                <td>
                  {w.alertEmail ?? (
                    <span style={{ color: 'var(--paper-muted)' }}>—</span>
                  )}
                </td>
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
    </section>
  );
}
