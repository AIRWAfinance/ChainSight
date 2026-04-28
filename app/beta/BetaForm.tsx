'use client';

import { useState, type FormEvent } from 'react';

export function BetaForm() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/beta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role, company, notes }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? 'Submission failed');
        return;
      }
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="beta-thanks">
        <div className="big">✓ Thank you.</div>
        <p>
          Your request is in. We respond to every signup within 48 hours, often
          much sooner. Check your inbox (and spam folder) for the next note.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form beta-form">
      <label className="auth-field">
        <span>Work email *</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
          autoComplete="email"
          placeholder="you@company.com"
        />
      </label>
      <label className="auth-field">
        <span>Role</span>
        <input
          type="text"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          disabled={submitting}
          placeholder="MLRO, Head of Compliance, Risk, Engineer…"
        />
      </label>
      <label className="auth-field">
        <span>Company</span>
        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          disabled={submitting}
        />
      </label>
      <label className="auth-field">
        <span>What would you use ChainSight for?</span>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={submitting}
          placeholder="(Optional) Onboarding screening, deposit/withdrawal monitoring, periodic CDD review, internal SAR investigations…"
        />
      </label>
      {error && <div className="scan-error">{error}</div>}
      <button type="submit" className="btn-gold" disabled={submitting}>
        {submitting ? 'Sending…' : 'Request beta access →'}
      </button>
      <p className="beta-fineprint">
        We use your email only to grant access and follow up on your request.
        No newsletters, ever.
      </p>
    </form>
  );
}
