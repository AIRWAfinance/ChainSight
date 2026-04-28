import type { Metadata } from 'next';
import { FilmGrain } from '@/components/FilmGrain';
import { Ticker } from '@/components/Ticker';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { Dashboard } from './Dashboard';

export const metadata: Metadata = {
  title: 'Dashboard — ChainSight',
  description: 'Saved scans + watchlist for the wallets you monitor.',
};

export default function DashboardPage() {
  return (
    <>
      <FilmGrain />
      <Ticker />
      <Nav />
      <Dashboard />
      <Footer />
    </>
  );
}
