'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

type Stage = 'password' | 'mfa';

export function LoginForm() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handlePasswordSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? 'Sign-in failed');
        return;
      }
      if (json.needs_mfa) {
        setStage('mfa');
        return;
      }
      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMfaSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/mfa/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? 'Code rejected');
        return;
      }
      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setSubmitting(false);
    }
  }

  if (stage === 'mfa') {
    return (
      <form onSubmit={handleMfaSubmit} className="auth-form">
        <p className="auth-mfa-blurb">
          Two-factor required. Enter the 6-digit code from your authenticator app.
        </p>
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
            disabled={submitting}
            autoComplete="one-time-code"
            autoFocus
          />
        </label>
        {error && <div className="scan-error">{error}</div>}
        <button type="submit" className="btn-gold" disabled={submitting}>
          {submitting ? 'Verifying…' : 'Verify'}
        </button>
        <button
          type="button"
          className="btn-link"
          onClick={() => {
            setStage('password');
            setCode('');
            setError(null);
          }}
        >
          ← Back to sign-in
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handlePasswordSubmit} className="auth-form">
      <label className="auth-field">
        <span>Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
          autoComplete="email"
        />
      </label>
      <label className="auth-field">
        <span>Password</span>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting}
          autoComplete="current-password"
        />
      </label>
      {error && <div className="scan-error">{error}</div>}
      <button type="submit" className="btn-gold" disabled={submitting}>
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
