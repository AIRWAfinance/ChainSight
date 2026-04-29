'use client';

import { useEffect, useState } from 'react';

interface FreshnessRow {
  list: 'OFAC_SDN' | 'EU_CFSP' | 'UK_HMT' | 'UN_SC';
  lastSyncedAt: string | null;
  ageHours: number | null;
  count: number;
  isStale: boolean;
}

interface FreshnessResponse {
  lists: FreshnessRow[];
  staleCount: number;
  anyStale: boolean;
  oldestAgeHours: number | null;
}

const LIST_LABEL: Record<FreshnessRow['list'], string> = {
  OFAC_SDN: 'OFAC',
  EU_CFSP: 'EU',
  UK_HMT: 'UK',
  UN_SC: 'UN',
};

export function SanctionsFreshnessBanner() {
  const [data, setData] = useState<FreshnessResponse | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/sanctions/freshness')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (alive) setData(j as FreshnessResponse | null);
      })
      .catch(() => {
        /* silent */
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!data) return null;

  const stale = data.lists.filter((l) => l.isStale);

  if (stale.length === 0) {
    return (
      <div className="freshness-bar fresh">
        <span className="dot" aria-hidden="true" />
        <span className="label">Sanctions lists fresh</span>
        {data.lists.map((l) => (
          <span className="chip" key={l.list}>
            <b>{LIST_LABEL[l.list]}</b>
            {l.ageHours !== null ? `${Math.round(l.ageHours)}h` : '—'}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="freshness-bar stale" role="alert">
      <span className="dot" aria-hidden="true" />
      <span className="label">
        {stale.length === 1
          ? `Sanctions list stale: ${LIST_LABEL[stale[0]!.list]}`
          : `${stale.length} sanctions lists stale`}
      </span>
      {data.lists.map((l) => (
        <span className={`chip ${l.isStale ? 'stale' : ''}`} key={l.list}>
          <b>{LIST_LABEL[l.list]}</b>
          {l.ageHours !== null ? `${Math.round(l.ageHours)}h` : 'never'}
        </span>
      ))}
    </div>
  );
}
