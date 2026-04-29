import { FilmGrain } from '@/components/FilmGrain';
import { Ticker } from '@/components/Ticker';
import { Nav } from '@/components/Nav';
import { Mast } from '@/components/Mast';
import { StatsStrip } from '@/components/StatsStrip';
import { ScanSection } from '@/components/ScanSection';
import { Methodology } from '@/components/Methodology';
import { SampleReport } from '@/components/SampleReport';
import { TrustStrip } from '@/components/TrustStrip';
import { FinalCta } from '@/components/FinalCta';
import { Footer } from '@/components/Footer';
import { SanctionsFreshnessBanner } from '@/components/SanctionsFreshnessBanner';

export default function HomePage() {
  return (
    <>
      <FilmGrain />
      <Ticker />
      <Nav />
      <SanctionsFreshnessBanner />
      <Mast />
      <StatsStrip />
      <ScanSection />
      <Methodology />
      <SampleReport />
      <TrustStrip />
      <FinalCta />
      <Footer />
    </>
  );
}
