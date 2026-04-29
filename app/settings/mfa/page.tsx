import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { FilmGrain } from '@/components/FilmGrain';
import { getAuthenticatedSession } from '@/lib/auth/session';
import { getStorageBackend } from '@/lib/storage';
import { MfaSettings } from './MfaSettings';

export const metadata: Metadata = {
  title: 'Two-factor authentication — ChainSight',
};

export default async function MfaSettingsPage() {
  const session = await getAuthenticatedSession();
  if (!session) {
    redirect('/login?next=/settings/mfa');
  }
  const totp = await getStorageBackend().getUserTotpState(session.userId);
  const enabled = Boolean(totp?.verifiedAt);

  return (
    <>
      <FilmGrain />
      <Nav />
      <main className="mfa-main">
        <section className="mfa-hero">
          <div className="kicker">§ Settings · Two-factor</div>
          <h1>
            Two-factor<br />
            authentication.
          </h1>
          <p className="lede">
            ChainSight supports TOTP-based two-factor authentication
            (RFC 6238). Compatible with Google Authenticator, 1Password,
            Authy, Bitwarden, and any other authenticator app. Once enabled,
            sign-in requires both your password and a 6-digit code from your
            app.
          </p>
        </section>
        <section className="mfa-card-section">
          <MfaSettings
            initiallyEnabled={enabled}
            email={session.email}
          />
        </section>
      </main>
      <Footer />
    </>
  );
}
