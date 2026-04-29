import Link from 'next/link';
import type { ReactNode } from 'react';
import styles from './AppShell.module.css';

export interface Crumb {
  label: string;
  href?: string;
}

interface AppTopbarProps {
  /** Breadcrumb trail. The last item is rendered as the current page. */
  crumbs: Crumb[];
  /** Optional right-side actions (defaults to quick search + new-scan CTA). */
  actions?: ReactNode;
}

const ICON_SEARCH = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const ICON_PLUS = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

function DefaultActions(): React.ReactElement {
  return (
    <>
      <Link href="/scan" className={styles.qsearch} aria-label="Run a new scan">
        <span aria-hidden="true">{ICON_SEARCH}</span>
        <span>Quick scan or jump to&hellip;</span>
        <span className={styles.qsearchKbd}>&#8984;K</span>
      </Link>
      <Link href="/scan" className={styles.btnFill}>
        <span aria-hidden="true">{ICON_PLUS}</span>
        New scan
      </Link>
    </>
  );
}

export function AppTopbar({ crumbs, actions }: AppTopbarProps): React.ReactElement {
  const last = crumbs.length - 1;

  return (
    <div className={styles.topbar}>
      <nav aria-label="Breadcrumb" className={styles.crumbs}>
        {crumbs.map((c, i) => {
          const isLast = i === last;
          return (
            <span key={`${c.label}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem' }}>
              {i > 0 && <span className={styles.crumbSep} aria-hidden="true">/</span>}
              {isLast || !c.href ? (
                <span className={isLast ? styles.crumbHere : undefined} aria-current={isLast ? 'page' : undefined}>
                  {c.label}
                </span>
              ) : (
                <Link href={c.href} className={styles.crumbLink}>
                  {c.label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>
      <div className={styles.actions}>{actions ?? <DefaultActions />}</div>
    </div>
  );
}
