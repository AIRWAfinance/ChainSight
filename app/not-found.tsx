import Link from 'next/link';
import { FilmGrain } from '@/components/FilmGrain';
import { Ticker } from '@/components/Ticker';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';

export default function NotFound() {
  return (
    <>
      <FilmGrain />
      <Ticker />
      <Nav />
      <section className="section-cta" style={{ minHeight: '50vh' }}>
        <div className="kicker center">§ 404</div>
        <h2>Page <em>not found.</em></h2>
        <p>The page you were looking for doesn't exist or has moved.</p>
        <div className="cta-actions">
          <Link href="/" className="btn-gold">Return to home</Link>
        </div>
      </section>
      <Footer />
    </>
  );
}
