import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { FilmGrain } from '@/components/FilmGrain';
import { getAdminSession, getAuthenticatedSession } from '@/lib/auth/session';
import { getStorageBackend } from '@/lib/storage';
import { AdminConsole } from './AdminConsole';

export const metadata: Metadata = {
  title: 'Admin · ChainSight',
};

export default async function AdminPage() {
  const session = await getAuthenticatedSession();
  if (!session) {
    redirect('/login?next=/admin');
  }
  const adminSession = await getAdminSession();
  if (!adminSession) {
    redirect('/dashboard?error=forbidden');
  }

  const store = getStorageBackend();
  const [users, counts, recentAudit] = await Promise.all([
    store.listUsers(200),
    store.countUsers(),
    store.listAudit({ limit: 50 }),
  ]);

  return (
    <>
      <FilmGrain />
      <Nav />
      <main className="admin-main">
        <section className="admin-hero">
          <div className="kicker">§ Admin · operations console</div>
          <h1>
            Bureau<br />
            <em>operations.</em>
          </h1>
          <p className="lede">
            Operator-level view of the ChainSight tenant. User roster +
            role management, full-tenant audit trail, system telemetry.
            Every action you take here is itself written to the audit log.
          </p>
        </section>

        <AdminConsole
          currentUserId={adminSession.userId}
          currentEmail={adminSession.email}
          initialUsers={users}
          initialCounts={counts}
          recentAudit={recentAudit}
        />
      </main>
      <Footer />
    </>
  );
}
