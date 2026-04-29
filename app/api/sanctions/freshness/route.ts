import { NextResponse } from 'next/server';
import { getSanctionsFreshness } from '@/lib/data/sanctions';

export const runtime = 'nodejs';
export const revalidate = 60; // serve cached freshness for 60s

/**
 * GET /api/sanctions/freshness
 *
 * Public endpoint returning the freshness state of every sanctions list.
 * Used by the home-page banner to alert when any list is >24h stale.
 */
export async function GET() {
  const freshness = getSanctionsFreshness();
  const staleCount = freshness.filter((f) => f.isStale).length;
  const oldestAgeHours = freshness
    .map((f) => f.ageHours)
    .filter((h): h is number => h !== null)
    .reduce((max, h) => (h > max ? h : max), 0);

  return NextResponse.json(
    {
      lists: freshness.map((f) => ({
        list: f.list,
        lastSyncedAt: f.lastSyncedAt,
        ageHours: f.ageHours,
        count: f.count,
        lastSyncOk: f.lastSyncOk,
        isStale: f.isStale,
        fileExists: f.fileExists,
      })),
      staleCount,
      anyStale: staleCount > 0,
      oldestAgeHours: oldestAgeHours > 0 ? oldestAgeHours : null,
    },
    { status: 200 },
  );
}
