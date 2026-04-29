import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell/AppShell';
import { AlertsView } from './AlertsView';

export const metadata: Metadata = {
  title: 'Alerts — ChainSight',
  description: 'Saved scans that crossed the Enhanced-DD risk threshold.',
};

export default function AlertsPage() {
  return (
    <AppShell
      crumbs={[
        { label: 'Workspace' },
        { label: 'Alerts' },
      ]}
    >
      <AlertsView />
    </AppShell>
  );
}
