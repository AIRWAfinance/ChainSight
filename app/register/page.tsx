import type { Metadata } from 'next';
import { FilmGrain } from '@/components/FilmGrain';
import { Ticker } from '@/components/Ticker';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { RegisterForm } from './RegisterForm';

export const metadata: Metadata = {
  title: 'Create account — ChainSight',
};

export default function RegisterPage() {
  return (
    <>
      <FilmGrain />
      <Ticker />
      <Nav />
      <section className="auth-section">
        <div className="auth-card">
          <div className="kicker">§ Create account</div>
          <h1>Begin <em>monitoring.</em></h1>
          <p>
            Save scans, build a watchlist, and receive email alerts when wallet
            risk scores change. Already have an account? <a href="/login">Sign in</a>.
          </p>
          <RegisterForm />
        </div>
      </section>
      <Footer />
    </>
  );
}
