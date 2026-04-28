import type { Metadata } from 'next';
import { FilmGrain } from '@/components/FilmGrain';
import { Ticker } from '@/components/Ticker';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = {
  title: 'Sign in — ChainSight',
};

export default function LoginPage() {
  return (
    <>
      <FilmGrain />
      <Ticker />
      <Nav />
      <section className="auth-section">
        <div className="auth-card">
          <div className="kicker">§ Sign in</div>
          <h1>Welcome <em>back.</em></h1>
          <p>
            Sign in to access your saved scans and watchlist. New here?{' '}
            <a href="/register">Create an account</a>.
          </p>
          <LoginForm />
        </div>
      </section>
      <Footer />
    </>
  );
}
