'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { SavedScanSummary, WatchlistEntry } from '@/lib/storage';
import styles from './AppShell.module.css';

interface MeData {
  id: string;
  email: string;
  mfaEnabled?: boolean;
}

interface SidebarCounts {
  watchlistActive: number;
  alertsHigh: number;
  alertsCritical: number;
  reportsTotal: number;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  /** Numeric counter shown right-aligned (e.g. saved scans count). */
  count?: number | string;
  /** Pill badge (e.g. unread alerts). */
  badge?: number;
  /** True when an exact pathname match is required for active state. */
  exact?: boolean;
}

const ALERT_THRESHOLD = 50;

const ICON_DASHBOARD = (
  <svg viewBox="0 0 24 24">
    <path d="M3 12 12 4l9 8" />
    <path d="M5 10v10h14V10" />
  </svg>
);
const ICON_SCAN = (
  <svg viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);
const ICON_REPORT = (
  <svg viewBox="0 0 24 24">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6M9 13h6M9 17h6M9 9h2" />
  </svg>
);
const ICON_EYE = (
  <svg viewBox="0 0 24 24">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const ICON_BELL = (
  <svg viewBox="0 0 24 24">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a2 2 0 0 0 3.4 0" />
  </svg>
);
const ICON_BOOK = (
  <svg viewBox="0 0 24 24">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
  </svg>
);
const ICON_GRID = (
  <svg viewBox="0 0 24 24">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
  </svg>
);
const ICON_SHIELD = (
  <svg viewBox="0 0 24 24">
    <path d="M12 2 4 6v6c0 5 3.5 9.5 8 10 4.5-.5 8-5 8-10V6Z" />
  </svg>
);
const ICON_SETTINGS = (
  <svg viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const ICON_CHEV = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const REFERENCE: NavItem[] = [
  { href: '/methodology/coverage', label: 'Methodology', icon: ICON_BOOK },
  { href: '/methodology/calibration', label: 'Calibration', icon: ICON_GRID },
  { href: '/trust', label: 'Trust & sources', icon: ICON_SHIELD },
];

function buildWorkspace(counts: SidebarCounts | null): NavItem[] {
  const items: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: ICON_DASHBOARD, exact: true },
    { href: '/scan', label: 'New scan', icon: ICON_SCAN },
  ];

  items.push({
    href: '/dashboard',
    label: 'Reports',
    icon: ICON_REPORT,
    count: counts?.reportsTotal,
  });

  items.push({
    href: '/watchlist',
    label: 'Watchlist',
    icon: ICON_EYE,
    count: counts?.watchlistActive,
  });

  const alertsTotal = counts ? counts.alertsHigh + counts.alertsCritical : undefined;
  items.push({
    href: '/alerts',
    label: 'Alerts',
    icon: ICON_BELL,
    badge: alertsTotal && alertsTotal > 0 ? alertsTotal : undefined,
    count: alertsTotal === 0 ? 0 : undefined,
  });

  return items;
}

function isActive(pathname: string, item: NavItem, occurrenceIndex: number, sameHrefCount: number): boolean {
  // When multiple items point to the same href (e.g. Dashboard + Reports both point to /dashboard),
  // only mark the FIRST one active to avoid double-highlighting.
  if (sameHrefCount > 1 && occurrenceIndex !== 0) return false;
  if (item.exact) {
    return pathname === item.href;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function userInitials(email: string): string {
  const local = email.split('@')[0] ?? '';
  const parts = local.split(/[._-]/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]![0] + parts[1]![0]).toUpperCase();
  }
  return (local.slice(0, 2) || '??').toUpperCase();
}

function userDisplayName(email: string): string {
  const local = email.split('@')[0] ?? email;
  return local.replace(/[._-]+/g, ' ');
}

export function AppSidebar(): React.ReactElement {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const [me, setMe] = useState<MeData | null | 'loading'>('loading');
  const [counts, setCounts] = useState<SidebarCounts | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((j: { user: MeData | null }) => {
        if (!cancelled) setMe(j.user);
      })
      .catch(() => {
        if (!cancelled) setMe(null);
      });

    Promise.all([
      fetch('/api/watchlist').then((r) => r.json()),
      fetch('/api/scans').then((r) => r.json()),
    ])
      .then(([w, s]: [
        { watchlist?: WatchlistEntry[] },
        { scans?: SavedScanSummary[] },
      ]) => {
        if (cancelled) return;
        const watchlist = w.watchlist ?? [];
        const scans = s.scans ?? [];
        const watchlistActive = watchlist.filter((x) => x.status === 'active').length;
        const alertsHigh = scans.filter((x) => x.riskScore >= ALERT_THRESHOLD && x.riskScore < 75).length;
        const alertsCritical = scans.filter((x) => x.riskScore >= 75).length;
        setCounts({
          watchlistActive,
          alertsHigh,
          alertsCritical,
          reportsTotal: scans.length,
        });
      })
      .catch(() => {
        // counts are optional; silently fail
      });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  async function handleSignOut(): Promise<void> {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setMe(null);
      router.push('/');
      router.refresh();
    }
  }

  const workspace = buildWorkspace(counts);
  const hrefCounts = workspace.reduce<Record<string, number>>((acc, it) => {
    acc[it.href] = (acc[it.href] ?? 0) + 1;
    return acc;
  }, {});
  const hrefSeen: Record<string, number> = {};

  return (
    <aside className={styles.side} aria-label="Primary navigation">
      <Link href="/" className={styles.brand} aria-label="ChainSight home">
        <span className={styles.brandMark} aria-hidden="true" />
        <span className={styles.brandLockup}>
          <span className={styles.brandLogo}>ChainSight</span>
          <span className={styles.brandBy}>Bureau of AML intel</span>
        </span>
      </Link>

      <nav className={styles.group} aria-label="Workspace">
        <span className={styles.groupLabel}>Workspace</span>
        {workspace.map((item, idx) => {
          const occurrence = hrefSeen[item.href] ?? 0;
          hrefSeen[item.href] = occurrence + 1;
          const active = isActive(pathname, item, occurrence, hrefCounts[item.href] ?? 1);
          return (
            <Link
              key={`${item.href}-${idx}`}
              href={item.href}
              className={`${styles.item} ${active ? styles.itemActive : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <span className={styles.itemIcon} aria-hidden="true">{item.icon}</span>
              <span className={styles.itemLabel}>{item.label}</span>
              {item.badge !== undefined ? (
                <span className={styles.itemBadge}>{item.badge}</span>
              ) : item.count !== undefined ? (
                <span className={styles.itemCount}>{item.count}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <hr className={styles.divider} />

      <nav className={styles.group} aria-label="Reference">
        <span className={styles.groupLabel}>Reference</span>
        {REFERENCE.map((item) => {
          const active = isActive(pathname, item, 0, 1);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.item} ${active ? styles.itemActive : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <span className={styles.itemIcon} aria-hidden="true">{item.icon}</span>
              <span className={styles.itemLabel}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.sideFooter}>
        <hr className={styles.divider} />
        <Link
          href="/settings/mfa"
          className={`${styles.item} ${pathname.startsWith('/settings') ? styles.itemActive : ''}`}
        >
          <span className={styles.itemIcon} aria-hidden="true">{ICON_SETTINGS}</span>
          <span className={styles.itemLabel}>Settings</span>
        </Link>

        {me === 'loading' && <div className={styles.signedOutCta}>&nbsp;</div>}

        {me && me !== 'loading' && (
          <button
            type="button"
            className={styles.user}
            onClick={handleSignOut}
            title="Sign out"
            aria-label={`Signed in as ${me.email}. Click to sign out.`}
          >
            <span className={styles.userAvatar}>{userInitials(me.email)}</span>
            <span className={styles.userInfo}>
              <span className={styles.userName}>{userDisplayName(me.email)}</span>
              <span className={styles.userMeta}>{me.email}</span>
            </span>
            <span className={styles.userChev} aria-hidden="true">{ICON_CHEV}</span>
          </button>
        )}

        {me === null && (
          <Link href="/login" className={styles.item}>
            <span className={styles.itemLabel}>Sign in &rarr;</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
