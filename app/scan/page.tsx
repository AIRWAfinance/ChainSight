import type { Metadata } from 'next';
import { FilmGrain } from '@/components/FilmGrain';
import { Ticker } from '@/components/Ticker';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { ScanFlow } from './ScanFlow';

export const metadata: Metadata = {
  title: 'Run a scan — ChainSight',
  description: 'Paste an Ethereum address and receive an AML risk report.',
};

export default async function ScanPage({
  searchParams,
}: {
  searchParams: Promise<{ address?: string }>;
}) {
  const params = await searchParams;
  const address = typeof params.address === 'string' ? params.address : '';

  return (
    <>
      <FilmGrain />
      <Ticker />
      <Nav />
      <ScanFlow initialAddress={address} />
      <Footer />
    </>
  );
}
