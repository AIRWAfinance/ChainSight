'use client';

import { useState } from 'react';
import type { UserRow } from '@/lib/storage/types';
import type { AuditEvent } from '@/lib/audit/types';

interface AdminConsoleProps {
  currentUserId: string;
  currentEmail: string;
  initialUsers: UserRow[];
  initialCounts: { total: number; admins: number; mfaEnabled: number };
  recentAudit: AuditEvent[];
}

export function AdminConsole({
  currentUserId,
  currentEmail,
  initialUsers,
  initialCounts,
  recentAudit,
}: AdminConsoleProps) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [counts, setCounts] = useState(initialCounts);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function setRole(userId: string, role: 'admin' | 'user') {
    setBusy(userId);
    setError(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? 'Role change failed');
        return;
      }
      // Refresh the users + counts in-place.
      const refresh = await fetch('/api/admin/users');
      const data = await refresh.json();
      setUsers(data.users);
      setCounts(data.counts);
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <section className="admin-stats">
        <div className="admin-stat">
          <div className="num">{counts.total}</div>
          <div className="lbl">Total users</div>
        </div>
        <div className="admin-stat">
          <div className="num">{counts.admins}</div>
          <div className="lbl">Admins</div>
        </div>
        <div className="admin-stat">
          <div className="num">{counts.mfaEnabled}</div>
          <div className="lbl">MFA enabled</div>
        </div>
        <div className="admin-stat">
          <div className="num">{recentAudit.length}</div>
          <div className="lbl">Recent audit events</div>
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-head">
          <div>
            <h2>Users</h2>
            <p>
              Signed in as <code>{currentEmail}</code>. You cannot demote your
              own account from this UI — promote another admin first or use the
              <code> npm run admin:promote </code>CLI.
            </p>
          </div>
        </div>
        {error && <div className="scan-error">{error}</div>}
        <table className="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>MFA</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.id === currentUserId;
              const isAdmin = u.role === 'admin';
              return (
                <tr key={u.id}>
                  <td>
                    <code>{u.email}</code>
                    {isSelf && <span className="self-tag">you</span>}
                  </td>
                  <td>
                    <span className={`pill ${isAdmin ? 'pill-admin' : 'pill-user'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    {u.totpEnabled ? (
                      <span className="mfa-on">on</span>
                    ) : (
                      <span className="mfa-off">off</span>
                    )}
                  </td>
                  <td className="mono small">{u.createdAt.slice(0, 10)}</td>
                  <td>
                    {isAdmin ? (
                      <button
                        type="button"
                        className="btn-line tiny"
                        disabled={isSelf || busy === u.id}
                        onClick={() => setRole(u.id, 'user')}
                      >
                        {busy === u.id ? '…' : 'Demote'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-line tiny"
                        disabled={busy === u.id}
                        onClick={() => setRole(u.id, 'admin')}
                      >
                        {busy === u.id ? '…' : 'Promote to admin'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="admin-section">
        <div className="admin-head">
          <div>
            <h2>Recent audit events</h2>
            <p>
              Most-recent 50 events across the whole tenant. Filter and
              export the full set via{' '}
              <a href="/api/admin/audit?format=ndjson" download>
                /api/admin/audit?format=ndjson
              </a>
              .
            </p>
          </div>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Action</th>
              <th>Actor</th>
              <th>IP</th>
              <th>Target</th>
            </tr>
          </thead>
          <tbody>
            {recentAudit.map((e) => (
              <tr key={e.id}>
                <td className="mono small">{e.ts.slice(0, 19).replace('T', ' ')}</td>
                <td><code>{e.action}</code></td>
                <td className="mono small">{e.actorUserId?.slice(0, 8) ?? '—'}</td>
                <td className="mono small">{e.actorIp ?? '—'}</td>
                <td className="mono small">
                  {e.targetType}
                  {e.targetId ? `:${e.targetId.slice(0, 8)}` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
