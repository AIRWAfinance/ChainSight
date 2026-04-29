'use client';

import { useState, type FormEvent } from 'react';

interface MfaSettingsProps {
  initiallyEnabled: boolean;
  email: string;
}

type SetupState =
  | { stage: 'idle' }
  | { stage: 'enrolling'; secret: string; uri: string }
  | { stage: 'enabled' }
  | { stage: 'disabling' };

export function MfaSettings({ initiallyEnabled, email }: MfaSettingsProps) {
  const [state, setState] = useState<SetupState>(
    initiallyEnabled ? { stage: 'enabled' } : { stage: 'idle' },
  );
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<'secret' | 'uri' | null>(null);

  async function startSetup() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/auth/mfa/setup', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? 'Setup failed');
        return;
      }
      setState({ stage: 'enrolling', secret: json.secret, uri: json.otpauthUri });
      setCode('');
    } finally {
      setBusy(false);
    }
  }

  async function confirmSetup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? 'Verification failed');
        return;
      }
      setState({ stage: 'enabled' });
      setCode('');
    } finally {
      setBusy(false);
    }
  }

  async function confirmDisable(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/auth/mfa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, code }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? 'Disable failed');
        return;
      }
      setState({ stage: 'idle' });
      setCode('');
      setPassword('');
    } finally {
      setBusy(false);
    }
  }

  async function copy(value: string, kind: 'secret' | 'uri') {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard blocked — user can select manually */
    }
  }

  if (state.stage === 'idle') {
    return (
      <div className="mfa-card">
        <div className="mfa-status mfa-status-off">
          <span className="dot" />
          <span>Two-factor is <b>disabled</b></span>
        </div>
        <p>
          Adding two-factor authentication is the strongest single defence
          against credential-stuffing on your account.
        </p>
        {error && <div className="scan-error">{error}</div>}
        <button
          type="button"
          className="btn-gold"
          disabled={busy}
          onClick={startSetup}
        >
          {busy ? 'Starting…' : 'Enable two-factor'}
        </button>
      </div>
    );
  }

  if (state.stage === 'enrolling') {
    return (
      <div className="mfa-card">
        <div className="mfa-status mfa-status-pending">
          <span className="dot" />
          <span>Enrolment in progress</span>
        </div>

        <h3>1. Add ChainSight to your authenticator app</h3>
        <p>
          Open Google Authenticator, 1Password, Authy, Bitwarden, or any
          other RFC 6238 TOTP app. Add a new account using either the
          <code> otpauth://</code> link below, or by manual entry.
        </p>

        <div className="mfa-field">
          <label>otpauth link (paste into your app, or open on your phone)</label>
          <div className="mfa-copy-row">
            <code className="mfa-uri">{state.uri}</code>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => copy(state.uri, 'uri')}
            >
              {copied === 'uri' ? 'Copied' : 'Copy link'}
            </button>
          </div>
        </div>

        <div className="mfa-field">
          <label>Or enter the secret manually</label>
          <ul className="mfa-manual">
            <li><span>Account</span><code>{email}</code></li>
            <li><span>Issuer</span><code>ChainSight</code></li>
            <li><span>Type</span><code>Time-based (TOTP)</code></li>
            <li><span>Algorithm</span><code>SHA1 · 6 digits · 30s step</code></li>
            <li>
              <span>Secret</span>
              <span className="mfa-copy-row inline">
                <code>{state.secret}</code>
                <button
                  type="button"
                  className="btn-secondary tiny"
                  onClick={() => copy(state.secret, 'secret')}
                >
                  {copied === 'secret' ? 'Copied' : 'Copy'}
                </button>
              </span>
            </li>
          </ul>
        </div>

        <h3>2. Confirm with the first code</h3>
        <form onSubmit={confirmSetup} className="auth-form mfa-confirm">
          <label className="auth-field">
            <span>Enter the 6-digit code from your app</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              disabled={busy}
              autoFocus
            />
          </label>
          {error && <div className="scan-error">{error}</div>}
          <button type="submit" className="btn-gold" disabled={busy}>
            {busy ? 'Verifying…' : 'Confirm and enable'}
          </button>
          <button
            type="button"
            className="btn-link"
            onClick={() => {
              setState({ stage: 'idle' });
              setCode('');
              setError(null);
            }}
          >
            Cancel
          </button>
        </form>
      </div>
    );
  }

  if (state.stage === 'enabled') {
    return (
      <div className="mfa-card">
        <div className="mfa-status mfa-status-on">
          <span className="dot" />
          <span>Two-factor is <b>enabled</b></span>
        </div>
        <p>
          Sign-in now requires your password plus a 6-digit code from your
          authenticator app.
        </p>
        <button
          type="button"
          className="btn-line"
          onClick={() => {
            setState({ stage: 'disabling' });
            setError(null);
          }}
        >
          Disable two-factor…
        </button>
      </div>
    );
  }

  // disabling
  return (
    <div className="mfa-card">
      <div className="mfa-status mfa-status-pending">
        <span className="dot" />
        <span>Disable two-factor</span>
      </div>
      <p>
        Confirm with both your current password AND a fresh 6-digit code.
        Both are required so a stolen session cookie alone cannot turn off
        2FA.
      </p>
      <form onSubmit={confirmDisable} className="auth-form">
        <label className="auth-field">
          <span>Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
            autoComplete="current-password"
          />
        </label>
        <label className="auth-field">
          <span>Authentication code</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            disabled={busy}
          />
        </label>
        {error && <div className="scan-error">{error}</div>}
        <button type="submit" className="btn-gold" disabled={busy}>
          {busy ? 'Disabling…' : 'Disable two-factor'}
        </button>
        <button
          type="button"
          className="btn-link"
          onClick={() => {
            setState({ stage: 'enabled' });
            setCode('');
            setPassword('');
            setError(null);
          }}
        >
          Cancel
        </button>
      </form>
    </div>
  );
}
