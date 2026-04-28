'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

interface ScanFormProps {
  defaultAddress?: string;
  variant?: 'landing' | 'compact';
}

export function ScanForm({ defaultAddress = '', variant = 'landing' }: ScanFormProps) {
  const router = useRouter();
  const [address, setAddress] = useState(defaultAddress);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const trimmed = address.trim();
    if (!ADDRESS_RE.test(trimmed)) {
      setError('That does not look like a valid Ethereum address. Expected format: 0x followed by 40 hex characters.');
      return;
    }
    setSubmitting(true);
    router.push(`/scan?address=${encodeURIComponent(trimmed)}`);
  }

  return (
    <>
      <form className="scan-form" onSubmit={handleSubmit}>
        <div className="scan-form-hdr">
          <span>chainsight :: scan</span>
          <span className="scan-form-live">Engine ready</span>
        </div>
        <div className="scan-form-body">
          <div className="scan-form-chain">
            <span className="lbl">Chain</span>
            <span className="v">⬢ Ethereum</span>
            <span style={{ fontSize: '0.68rem', color: 'var(--paper-muted)' }}>mainnet</span>
          </div>
          <div className="scan-form-input">
            <label className="lbl" htmlFor="cs-address">Wallet address</label>
            <input
              id="cs-address"
              autoComplete="off"
              spellCheck={false}
              placeholder="0x…"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={submitting}
            />
          </div>
        </div>
        <div className="scan-form-submit">
          <div className="scan-form-legend">
            <span><b>~6s</b> est.</span>
            <span><b>5</b> typologies</span>
            <span><b>FATF · OFAC</b> sources</span>
          </div>
          <button type="submit" className="scan-form-btn" disabled={submitting}>
            <span>{submitting ? 'Working…' : 'Generate report'}</span>
            <span className="arrow">→</span>
          </button>
        </div>
      </form>
      {error && <div className="scan-error">{error}</div>}
      {variant === 'landing' && (
        <div className="quick-links">
          <a onClick={() => setAddress('0x64954FcfEe8eF00416c40E3ff624dC6DdE7Ca0B4')}>
            Try sample address
          </a>
          <a href="#methodology">Read methodology</a>
          <a href="https://github.com/AIRWAfinance/ChainSight" target="_blank" rel="noreferrer">
            View on GitHub
          </a>
        </div>
      )}
    </>
  );
}
