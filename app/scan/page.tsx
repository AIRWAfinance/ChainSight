import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell/AppShell';
import { ScanFlow } from './ScanFlow';

export const metadata: Metadata = {
  title: 'Run a scan — ChainSight',
  description: 'Paste an Ethereum address and receive an AML risk report.',
};

interface ScanPageProps {
  searchParams: Promise<{ address?: string; chain?: string }>;
}

export default async function ScanPage({ searchParams }: ScanPageProps) {
  const params = await searchParams;
  const address = typeof params.address === 'string' ? params.address : '';
  const chain = typeof params.chain === 'string' ? params.chain : 'ethereum';

  return (
    <AppShell
      crumbs={[
        { label: 'Workspace' },
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'New scan' },
      ]}
    >
      <ScanFlow initialAddress={address} initialChain={chain} />
    </AppShell>
  );
}
