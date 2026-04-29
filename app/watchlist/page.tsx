import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell/AppShell';
import { WatchlistView } from './WatchlistView';

export const metadata: Metadata = {
  title: 'Watchlist — ChainSight',
  description: 'Addresses being monitored for AML risk changes.',
};

export default function WatchlistPage() {
  return (
    <AppShell
      crumbs={[
        { label: 'Workspace' },
        { label: 'Watchlist' },
      ]}
    >
      <WatchlistView />
    </AppShell>
  );
}
