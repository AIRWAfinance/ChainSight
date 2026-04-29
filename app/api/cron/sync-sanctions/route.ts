import { NextResponse } from 'next/server';
import { spawn } from 'node:child_process';
import {
  clearSanctionsCache,
  getSanctionsFreshness,
} from '@/lib/data/sanctions';
import { logSanctionsSync, recordAuditEvent, clientIpFrom } from '@/lib/audit/log';

export const runtime = 'nodejs';
export const maxDuration = 120;

/**
 * Vercel Cron entrypoint — daily refresh of all sanctions lists.
 *
 * Configured via vercel.json `crons` to fire once a day at 02:00 UTC.
 *
 * Protected by the standard Vercel-Cron header OR an explicit
 * CRON_SECRET bearer token (so manual `curl` triggers are also authenticated).
 *
 * The endpoint shells out to the existing `npm run sync:*` scripts. Each
 * sync script is a one-shot tsx process that writes a JSON file and exits.
 * Logs every list outcome (count, success/failure) to the audit trail.
 */
const SYNC_SCRIPTS: Array<{
  name: string;
  cmd: string;
  args: string[];
  list: 'OFAC_SDN' | 'EU_CFSP' | 'UK_HMT' | 'UN_SC';
}> = [
  { name: 'OFAC SDN', cmd: 'npm', args: ['run', 'sync:ofac'], list: 'OFAC_SDN' },
  { name: 'EU CFSP', cmd: 'npm', args: ['run', 'sync:eu'], list: 'EU_CFSP' },
  { name: 'UK OFSI', cmd: 'npm', args: ['run', 'sync:uk'], list: 'UK_HMT' },
  { name: 'UN SC', cmd: 'npm', args: ['run', 'sync:un'], list: 'UN_SC' },
];

function isAuthorized(req: Request): boolean {
  // Vercel adds `x-vercel-cron: 1` for cron invocations.
  if (req.headers.get('x-vercel-cron')) return true;

  const expected = process.env['CRON_SECRET'];
  if (!expected) return false;
  const auth = req.headers.get('authorization');
  if (!auth) return false;
  const [scheme, token] = auth.split(' ');
  return scheme === 'Bearer' && token === expected;
}

function runScript(cmd: string, args: string[]): Promise<{ ok: boolean; output: string }> {
  return new Promise((resolveP) => {
    const proc = spawn(cmd, args, {
      shell: process.platform === 'win32',
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    proc.stdout.on('data', (d) => (out += d.toString()));
    proc.stderr.on('data', (d) => (out += d.toString()));
    proc.on('close', (code) => resolveP({ ok: code === 0, output: out }));
    proc.on('error', (err) => resolveP({ ok: false, output: err.message }));
  });
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const ip = clientIpFrom(req);
  const results: Array<{
    list: string;
    ok: boolean;
    output: string;
  }> = [];

  for (const script of SYNC_SCRIPTS) {
    const r = await runScript(script.cmd, script.args);
    results.push({ list: script.list, ok: r.ok, output: r.output.slice(-500) });

    if (!r.ok) {
      await recordAuditEvent({
        actorUserId: null,
        actorIp: ip,
        action: 'sanctions.sync_failed',
        targetType: 'sanctions_list',
        targetId: script.list,
        payload: { tail: r.output.slice(-500) },
      });
    }
  }

  // Invalidate in-process cache so subsequent reads see fresh files.
  clearSanctionsCache();

  // Audit-log per list using the now-fresh counts.
  const freshness = getSanctionsFreshness();
  for (const f of freshness) {
    if (f.lastSyncOk) {
      await logSanctionsSync({ actorIp: ip, list: f.list, count: f.count });
    }
  }

  return NextResponse.json(
    { ok: true, results, freshness },
    { status: 200 },
  );
}

export async function GET(req: Request) {
  // Allow Vercel Cron's GET probe, falling through to the same logic.
  return POST(req);
}
