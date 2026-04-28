'use client';

import { useEffect, useState, useCallback } from 'react';
import type { RiskReport } from '@/lib/engine/types';
import { CHAINS, isChainSlug, type ChainSlug } from '@/lib/data/chains';
import { ScanForm } from '@/components/ScanForm';
import { Report } from '@/components/Report';

interface ScanFlowProps {
  initialAddress: string;
  initialChain?: string;
}

type Stage = 'idle' | 'fetching' | 'analyzing' | 'done' | 'error';

interface ApiSuccess {
  report: RiskReport;
}
interface ApiError {
  error: string;
  message: string;
}

const STAGE_LABELS: Record<Stage, string[]> = {
  idle: [],
  fetching: [
    'Submitting address to engine',
    'Fetching transactions from Etherscan',
    'Running typology detectors',
    'Composing risk report',
  ],
  analyzing: [
    'Submitting address to engine',
    'Fetching transactions from Etherscan',
    'Running typology detectors',
    'Composing risk report',
  ],
  done: [],
  error: [],
};

export function ScanFlow({ initialAddress, initialChain }: ScanFlowProps) {
  const validChain: ChainSlug =
    initialChain && isChainSlug(initialChain) ? initialChain : 'ethereum';

  const [stage, setStage] = useState<Stage>(initialAddress ? 'fetching' : 'idle');
  const [activeStep, setActiveStep] = useState(0);
  const [report, setReport] = useState<RiskReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scannedAddress, setScannedAddress] = useState<string>(initialAddress);
  const [scannedChain, setScannedChain] = useState<ChainSlug>(validChain);

  const runScan = useCallback(
    async (address: string, chain: ChainSlug) => {
      setStage('fetching');
      setActiveStep(0);
      setReport(null);
      setError(null);
      setScannedAddress(address);
      setScannedChain(chain);

      const stepInterval = window.setInterval(() => {
        setActiveStep((s) => Math.min(s + 1, 2));
      }, 1400);

      try {
        const res = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, chain }),
        });
        window.clearInterval(stepInterval);
        setActiveStep(3);

        const json = (await res.json()) as ApiSuccess | ApiError;
        if (!res.ok || 'error' in json) {
          const errMsg = 'message' in json ? json.message : 'Unknown error';
          setError(errMsg);
          setStage('error');
          return;
        }
        setReport((json as ApiSuccess).report);
        setStage('done');
      } catch (err: unknown) {
        window.clearInterval(stepInterval);
        const msg = err instanceof Error ? err.message : 'Network error';
        setError(msg);
        setStage('error');
      }
    },
    [],
  );

  useEffect(() => {
    if (initialAddress && /^0x[a-fA-F0-9]{40}$/.test(initialAddress)) {
      runScan(initialAddress, validChain);
    }
  }, [initialAddress, validChain, runScan]);

  if (stage === 'fetching' || stage === 'analyzing') {
    const stages = STAGE_LABELS.fetching;
    return (
      <section className="scan-loading">
        <div className="kicker center">§ Scanning</div>
        <h2>
          Wallet <em>{scannedAddress.slice(0, 6)}…{scannedAddress.slice(-4)}</em>
        </h2>
        <p style={{ color: 'var(--paper-dim)', marginTop: '0.5rem' }}>
          Reading <b>{CHAINS[scannedChain].name}</b>. This usually takes 4-8 seconds.
        </p>
        <div className="stages">
          {stages.map((label, i) => {
            const cls = i < activeStep ? 'done' : i === activeStep ? 'active' : '';
            return (
              <div key={label} className={`stage ${cls}`}>
                <span className="marker">{i < activeStep ? '✓' : i === activeStep ? '·' : ''}</span>
                <span>{label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  {i < activeStep ? 'done' : i === activeStep ? 'running' : 'queued'}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  if (stage === 'error') {
    return (
      <section className="section-scan" style={{ minHeight: '60vh' }}>
        <div className="scan-grid">
          <div>
            <div className="kicker">§ Scan failed</div>
            <h2>
              We couldn't <em>complete</em> the scan.
            </h2>
            <p className="intro">
              The engine returned an error while analysing this address. Try
              again, or paste a different address.
            </p>
            <div className="scan-error" style={{ marginTop: '1.5rem' }}>{error}</div>
          </div>
          <div>
            <ScanForm
              defaultAddress={scannedAddress}
              defaultChain={scannedChain}
              variant="compact"
            />
          </div>
        </div>
      </section>
    );
  }

  if (stage === 'done' && report) {
    return (
      <>
        <Report report={report} variant="live" />
        <section className="section-scan">
          <div className="scan-grid">
            <div>
              <div className="kicker">§ Scan another</div>
              <h2>
                More wallets to <em>review?</em>
              </h2>
              <p className="intro">
                ChainSight is rate-limited per address by Etherscan's free tier
                (5 req/sec). For batch screening, request API access.
              </p>
            </div>
            <div>
              <ScanForm variant="compact" />
            </div>
          </div>
        </section>
      </>
    );
  }

  // idle
  return (
    <section className="section-scan" style={{ minHeight: '60vh' }}>
      <div className="scan-grid">
        <div>
          <div className="kicker">§ Run a scan</div>
          <h2>
            Paste a wallet.<br />
            Receive a report in <em>seconds</em>.
          </h2>
          <p className="intro">
            Five typology detectors, OFAC SDN screening, and deterministic
            scoring. Every flag carries an evidence trail and a citation back
            to its regulatory source.
          </p>
        </div>
        <div>
          <ScanForm />
        </div>
      </div>
    </section>
  );
}
