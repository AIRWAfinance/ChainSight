'use client';

import { useState } from 'react';
import type { RiskReport } from '@/lib/engine/types';

interface SaveActionsProps {
  report: RiskReport;
}

export function SaveActions({ report }: SaveActionsProps) {
  const [savedId, setSavedId] = useState<string | null>(null);
  const [watching, setWatching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [emailMode, setEmailMode] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function saveScan() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Save failed');
      setSavedId(json.scan.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function addToWatch() {
    setAdding(true);
    setError(null);
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: report.address,
          chain: report.chain,
          alertEmail: email || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Add to watchlist failed');
      setWatching(true);
      setEmailMode(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Add failed');
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="save-actions">
      <button
        type="button"
        className="btn-line"
        onClick={saveScan}
        disabled={saving || savedId !== null}
      >
        {savedId ? '✓ Saved to dashboard' : saving ? 'Saving…' : '+ Save report'}
      </button>

      {!emailMode && !watching && (
        <button
          type="button"
          className="btn-gold"
          onClick={() => setEmailMode(true)}
        >
          + Add to watchlist
        </button>
      )}

      {emailMode && !watching && (
        <div className="watch-form">
          <input
            type="email"
            placeholder="alerts@email.com (optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={adding}
          />
          <button
            type="button"
            className="btn-gold"
            onClick={addToWatch}
            disabled={adding}
          >
            {adding ? 'Adding…' : 'Confirm'}
          </button>
          <button
            type="button"
            className="btn-line"
            onClick={() => setEmailMode(false)}
            disabled={adding}
          >
            Cancel
          </button>
        </div>
      )}

      {watching && (
        <span className="watch-confirmed">✓ Watching this address</span>
      )}

      {error && <div className="scan-error">{error}</div>}
    </div>
  );
}
