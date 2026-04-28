import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getWatchlistStore } from '@/lib/storage';
import { isChainSlug } from '@/lib/data/chains';
import type { ChainSlug } from '@/lib/engine/types';

export const runtime = 'nodejs';

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

const Body = z.object({
  address: z.string().regex(ADDRESS_RE, 'Invalid address'),
  chain: z.string(),
  alertEmail: z.string().email().optional().nullable(),
});

export async function GET() {
  const list = getWatchlistStore().list();
  return NextResponse.json({ watchlist: list }, { status: 200 });
}

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid body';
    return NextResponse.json(
      { error: 'invalid_request', message: msg },
      { status: 400 },
    );
  }

  if (!isChainSlug(parsed.chain)) {
    return NextResponse.json(
      { error: 'invalid_chain', message: `Unsupported chain "${parsed.chain}"` },
      { status: 400 },
    );
  }

  const entry = getWatchlistStore().add({
    address: parsed.address,
    chain: parsed.chain as ChainSlug,
    alertEmail: parsed.alertEmail ?? null,
  });

  return NextResponse.json({ entry }, { status: 201 });
}
