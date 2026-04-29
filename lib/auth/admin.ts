import { getStorageBackend } from '../storage/index.js';
import type { UserRole } from '../storage/types.js';

/**
 * Returns the set of email addresses that should automatically be promoted
 * to admin role on register or login. Configured via the
 * `CHAINSIGHT_ADMIN_EMAILS` env var as a comma-separated list (case-insensitive).
 */
export function adminEmailAllowlist(): Set<string> {
  const raw = process.env['CHAINSIGHT_ADMIN_EMAILS'];
  if (!raw) return new Set();
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * If the user's email is in the allowlist and they are not yet admin,
 * promote them. Idempotent. Returns the role the user has after the call.
 */
export async function ensureAdminFromAllowlist(
  userId: string,
  email: string,
  currentRole: UserRole,
): Promise<UserRole> {
  if (currentRole === 'admin') return 'admin';
  const allowlist = adminEmailAllowlist();
  if (!allowlist.has(email.trim().toLowerCase())) return currentRole;
  await getStorageBackend().setUserRole(userId, 'admin');
  return 'admin';
}
