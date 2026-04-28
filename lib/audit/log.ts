import { getStorageBackend } from '../storage/index.js';
import type {
  AuditAction,
  AuditEvent,
  AuditTargetType,
} from './types.js';

export interface AuditContext {
  actorUserId?: string | null;
  actorIp?: string | null;
}

interface RecordOptions extends AuditContext {
  action: AuditAction;
  targetType: AuditTargetType;
  targetId?: string | null;
  payload?: Record<string, unknown>;
}

/**
 * Log an audit event. Never throws — logging failures must not break the
 * caller's flow. Returns the persisted event on success or null on failure.
 */
export async function recordAuditEvent(
  opts: RecordOptions,
): Promise<AuditEvent | null> {
  try {
    return await getStorageBackend().appendAudit({
      actorUserId: opts.actorUserId ?? null,
      actorIp: opts.actorIp ?? null,
      action: opts.action,
      targetType: opts.targetType,
      targetId: opts.targetId ?? null,
      payload: opts.payload ?? {},
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error(`[audit] failed to append ${opts.action}: ${msg}`);
    return null;
  }
}

export function clientIpFrom(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return 'unknown';
}

// Convenience helpers — keep payload schema consistent across callers.

export function logLoginSuccess(
  ctx: AuditContext & { userId: string; email: string },
): Promise<AuditEvent | null> {
  return recordAuditEvent({
    actorUserId: ctx.userId,
    actorIp: ctx.actorIp ?? null,
    action: 'auth.login.success',
    targetType: 'user',
    targetId: ctx.userId,
    payload: { email: ctx.email },
  });
}

export function logLoginFail(
  ctx: AuditContext & { email: string; reason: string },
): Promise<AuditEvent | null> {
  return recordAuditEvent({
    actorUserId: null,
    actorIp: ctx.actorIp ?? null,
    action: 'auth.login.fail',
    targetType: 'user',
    targetId: null,
    payload: { email: ctx.email, reason: ctx.reason },
  });
}

export function logLoginRateLimited(
  ctx: AuditContext & { email: string; retryAfterSeconds: number },
): Promise<AuditEvent | null> {
  return recordAuditEvent({
    actorUserId: null,
    actorIp: ctx.actorIp ?? null,
    action: 'auth.login.rate_limited',
    targetType: 'user',
    targetId: null,
    payload: {
      email: ctx.email,
      retryAfterSeconds: ctx.retryAfterSeconds,
    },
  });
}

export function logLogout(
  ctx: AuditContext & { userId: string },
): Promise<AuditEvent | null> {
  return recordAuditEvent({
    actorUserId: ctx.userId,
    actorIp: ctx.actorIp ?? null,
    action: 'auth.logout',
    targetType: 'user',
    targetId: ctx.userId,
    payload: {},
  });
}

export function logRegister(
  ctx: AuditContext & { userId: string; email: string },
): Promise<AuditEvent | null> {
  return recordAuditEvent({
    actorUserId: ctx.userId,
    actorIp: ctx.actorIp ?? null,
    action: 'auth.register',
    targetType: 'user',
    targetId: ctx.userId,
    payload: { email: ctx.email },
  });
}

export function logScanRun(
  ctx: AuditContext & {
    address: string;
    chain: string;
    riskScore: number;
    flagsCount: number;
    rulesVersion: string;
    rulesFingerprint: string;
  },
): Promise<AuditEvent | null> {
  return recordAuditEvent({
    actorUserId: ctx.actorUserId ?? null,
    actorIp: ctx.actorIp ?? null,
    action: 'scan.run',
    targetType: 'scan',
    targetId: null,
    payload: {
      address: ctx.address,
      chain: ctx.chain,
      riskScore: ctx.riskScore,
      flagsCount: ctx.flagsCount,
      rulesVersion: ctx.rulesVersion,
      rulesFingerprint: ctx.rulesFingerprint,
    },
  });
}

export function logScanSave(
  ctx: AuditContext & { scanId: string; address: string; riskScore: number },
): Promise<AuditEvent | null> {
  return recordAuditEvent({
    actorUserId: ctx.actorUserId ?? null,
    actorIp: ctx.actorIp ?? null,
    action: 'scan.save',
    targetType: 'scan',
    targetId: ctx.scanId,
    payload: { address: ctx.address, riskScore: ctx.riskScore },
  });
}

export function logScanDelete(
  ctx: AuditContext & { scanId: string },
): Promise<AuditEvent | null> {
  return recordAuditEvent({
    actorUserId: ctx.actorUserId ?? null,
    actorIp: ctx.actorIp ?? null,
    action: 'scan.delete',
    targetType: 'scan',
    targetId: ctx.scanId,
    payload: {},
  });
}

export function logScanExportPdf(
  ctx: AuditContext & { scanId: string },
): Promise<AuditEvent | null> {
  return recordAuditEvent({
    actorUserId: ctx.actorUserId ?? null,
    actorIp: ctx.actorIp ?? null,
    action: 'scan.export_pdf',
    targetType: 'scan',
    targetId: ctx.scanId,
    payload: {},
  });
}

export function logWatchAdd(
  ctx: AuditContext & {
    watchId: string;
    address: string;
    chain: string;
    alertEmail: string | null;
  },
): Promise<AuditEvent | null> {
  return recordAuditEvent({
    actorUserId: ctx.actorUserId ?? null,
    actorIp: ctx.actorIp ?? null,
    action: 'watchlist.add',
    targetType: 'watchlist',
    targetId: ctx.watchId,
    payload: {
      address: ctx.address,
      chain: ctx.chain,
      alertEmail: ctx.alertEmail,
    },
  });
}

export function logWatchRemove(
  ctx: AuditContext & { watchId: string },
): Promise<AuditEvent | null> {
  return recordAuditEvent({
    actorUserId: ctx.actorUserId ?? null,
    actorIp: ctx.actorIp ?? null,
    action: 'watchlist.remove',
    targetType: 'watchlist',
    targetId: ctx.watchId,
    payload: {},
  });
}

export function logWatchRescan(
  ctx: AuditContext & { watchId: string; address: string; riskScore: number },
): Promise<AuditEvent | null> {
  return recordAuditEvent({
    actorUserId: ctx.actorUserId ?? null,
    actorIp: ctx.actorIp ?? null,
    action: 'watchlist.rescan',
    targetType: 'watchlist',
    targetId: ctx.watchId,
    payload: { address: ctx.address, riskScore: ctx.riskScore },
  });
}

export function logSanctionsSync(
  ctx: AuditContext & { list: string; count: number },
): Promise<AuditEvent | null> {
  return recordAuditEvent({
    actorUserId: ctx.actorUserId ?? null,
    actorIp: ctx.actorIp ?? null,
    action: 'sanctions.sync',
    targetType: 'sanctions_list',
    targetId: ctx.list,
    payload: { count: ctx.count },
  });
}

export function logAuditExport(
  ctx: AuditContext & { rowsReturned: number },
): Promise<AuditEvent | null> {
  return recordAuditEvent({
    actorUserId: ctx.actorUserId ?? null,
    actorIp: ctx.actorIp ?? null,
    action: 'audit.export',
    targetType: 'system',
    targetId: null,
    payload: { rowsReturned: ctx.rowsReturned },
  });
}
