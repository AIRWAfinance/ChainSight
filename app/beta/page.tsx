import type { Metadata } from 'next';
import { FilmGrain } from '@/components/FilmGrain';
import { Ticker } from '@/components/Ticker';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { BetaForm } from './BetaForm';

export const metadata: Metadata = {
  title: 'Private beta — ChainSight',
  description:
    'Join the ChainSight private beta. Compliance teams, fund administrators, and regulated exchanges can request early access today.',
};

export default function BetaPage() {
  return (
    <>
      <FilmGrain />
      <Ticker />
      <Nav />

      <section className="beta-hero">
        <div className="kicker">§ Private beta</div>
        <h1>
          A defensible AML engine,<br />
          <em>before</em> everyone else.
        </h1>
        <p className="lede">
          ChainSight is in private beta with a small group of compliance teams,
          fund administrators, and regulated exchanges. Beta members get a free
          tier, direct line to the engineer, and shape the v1 roadmap.
        </p>
      </section>

      <section className="beta-grid">
        <div className="beta-pillars">
          <div className="kicker muted">What you get</div>
          <ol>
            <li>
              <h3>Free tier during beta.</h3>
              <p>Unlimited scans on Ethereum + Polygon + BSC + Arbitrum + Base + Optimism. Watchlist, dashboard, PDF export, email alerts — all included.</p>
            </li>
            <li>
              <h3>Direct line to the builder.</h3>
              <p>You get my email. Bugs are fixed in days, not quarters. Feature requests with a real use case typically ship within two weeks.</p>
            </li>
            <li>
              <h3>Citation-first reporting auditors love.</h3>
              <p>Every flag links to its FATF or OFAC source. No black-box ML. Reports are reproducible across runs and defensible in a regulator's review.</p>
            </li>
            <li>
              <h3>Open-source engine, MIT licence.</h3>
              <p>You can self-host. You can read the detector code. There is no vendor lock-in.</p>
            </li>
          </ol>
        </div>

        <div className="beta-form-card">
          <div className="kicker">§ Request access</div>
          <h2>Tell us a bit <em>about you.</em></h2>
          <p>
            We're prioritising teams already running compliance workflows on
            Ethereum or EVM L2s. We respond to every request within 48 hours.
          </p>
          <BetaForm />
        </div>
      </section>

      <Footer />
    </>
  );
}
