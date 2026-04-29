import { NextResponse } from 'next/server';
import { getStorageBackend } from '@/lib/storage';
import { getAdminSession } from '@/lib/auth/session';
import { clientIpFrom, logAuditExport } from '@/lib/audit/log';
import type { AuditAction, AuditTargetType } from '@/lib/audit/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

const VALID_ACTIONS: ReadonlySet<AuditAction> = new Set([
  'auth.login.success',
  'auth.login.fail',
  'auth.login.rate_limited',
  'auth.logout',
  'auth.register',
  'scan.run',
  'scan.save',
  'scan.delete',
  'scan.export_pdf',
  'watchlist.add',
  'watchlist.remove',
  'watchlist.rescan',
  'sanctions.sync',
  'sanctions.sync_failed',
  'audit.export',
]);

const VALID_TARGET_TYPES: ReadonlySet<AuditTargetType> = new Set([
  'user',
  'scan',
  'watchlist',
  'sanctions_list',
  'system',
]);

/**
 * GET /api/admin/audit
 *
 * Admin-only: returns ALL users' audit events, filterable by user, action,
 * target type, and time range. NDJSON or JSON output.
 */
export async function GET(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');
  const action = url.searchParams.get('action');
  const targetType = url.searchParams.get('targetType');
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const limitRaw = url.searchParams.get('limit');
  const format = url.searchParams.get('format') ?? 'json';

  if (action && !VALID_ACTIONS.has(action as AuditAction)) {
    return NextResponse.json(
      { error: 'invalid_action', message: `Unknown action: ${action}` },
      { status: 400 },
    );
  }
  if (targetType && !VALID_TARGET_TYPES.has(targetType as AuditTargetType)) {
    return NextResponse.json(
      { error: 'invalid_target_type', message: `Unknown targetType: ${targetType}` },
      { status: 400 },
    );
  }
  const limit = limitRaw ? Math.min(10000, Math.max(1, Number(limitRaw))) : 500;

  const events = await getStorageBackend().listAudit({
    userId: userId ?? undefined,
    action: action ? (action as AuditAction) : undefined,
    targetType: targetType ? (targetType as AuditTargetType) : undefined,
    fromTs: from ?? undefined,
    toTs: to ?? undefined,
    limit,
  });

  await logAuditExport({
    actorUserId: session.userId,
    actorIp: clientIpFrom(req),
    rowsReturned: events.length,
  });

  if (format === 'ndjson') {
    const ndjson = events.map((e) => JSON.stringify(e)).join('\n');
    const filename = `chainsight-audit-admin-${new Date().toISOString().slice(0, 10)}.ndjson`;
    return new Response(ndjson, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  }
  return NextResponse.json({ events, count: events.length }, { status: 200 });
}
