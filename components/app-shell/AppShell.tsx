import type { ReactNode } from 'react';
import { Ticker } from '../Ticker';
import { AppSidebar } from './AppSidebar';
import { AppTopbar, type Crumb } from './AppTopbar';
import styles from './AppShell.module.css';

interface AppShellProps {
  /** Breadcrumb trail rendered in the topbar. */
  crumbs: Crumb[];
  /** Page content rendered inside the padded main area. */
  children: ReactNode;
  /** Optional override for the topbar right-side actions. */
  topbarActions?: ReactNode;
}

/**
 * Authenticated-zone layout: ticker + sidebar + topbar + page area.
 * Use only on pages that should live inside the app shell
 * (dashboard, scan, settings, etc.). Public marketing pages keep
 * the existing Nav/Footer layout.
 */
export function AppShell({ crumbs, children, topbarActions }: AppShellProps): React.ReactElement {
  return (
    <>
      <Ticker />
      <div className={styles.shell}>
        <AppSidebar />
        <main className={styles.content}>
          <AppTopbar crumbs={crumbs} actions={topbarActions} />
          <div className={styles.page}>{children}</div>
        </main>
      </div>
    </>
  );
}

export type { Crumb } from './AppTopbar';
