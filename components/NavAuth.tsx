'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Me {
  id: string;
  email: string;
  mfaEnabled?: boolean;
  mfaPending?: boolean;
}

export function NavAuth() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null | 'loading'>('loading');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((j: { user: Me | null }) => setMe(j.user))
      .catch(() => setMe(null));
  }, []);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setMe(null);
    router.push('/');
    router.refresh();
  }

  if (me === 'loading') {
    return <div className="nav-right" />;
  }

  if (!me) {
    return (
      <div className="nav-right">
        <Link href="/login" className="btn-line">Sign in</Link>
        <Link href="/register" className="btn-gold">Create account</Link>
      </div>
    );
  }

  return (
    <div className="nav-right nav-right-authed">
      <span className="nav-email mono">{me.email}</span>
      <Link href="/scan" className="btn-line">Run a scan</Link>
      <Link
        href="/settings/mfa"
        className="btn-line"
        title={me.mfaEnabled ? 'Two-factor enabled' : 'Two-factor recommended'}
      >
        {me.mfaEnabled ? '2FA ✓' : '2FA'}
      </Link>
      <button type="button" className="btn-line" onClick={logout}>
        Sign out
      </button>
    </div>
  );
}
