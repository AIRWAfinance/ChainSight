import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getStorageBackend } from '@/lib/storage';
import { getAdminSession } from '@/lib/auth/session';
import { clientIpFrom, recordAuditEvent } from '@/lib/audit/log';

export const runtime = 'nodejs';

const PromoteBody = z.object({
  userId: z.string().min(1),
  role: z.enum(['admin', 'user']),
});

/**
 * GET /api/admin/users — list every user with role + MFA flag.
 * PATCH /api/admin/users — set role on a target user.
 *
 * Both endpoints require an admin-role session.
 */
export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const users = await getStorageBackend().listUsers(500);
  const counts = await getStorageBackend().countUsers();
  return NextResponse.json({ users, counts }, { status: 200 });
}

export async function PATCH(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  let body;
  try {
    body = PromoteBody.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: 'invalid_request', message: 'Body must be { userId, role }' },
      { status: 400 },
    );
  }
  // Refuse self-demotion to avoid locking out the only admin by accident.
  if (body.userId === session.userId && body.role !== 'admin') {
    return NextResponse.json(
      {
        error: 'self_demote_blocked',
        message:
          'You cannot demote your own account. Promote another admin first, or use the admin:promote CLI.',
      },
      { status: 400 },
    );
  }
  await getStorageBackend().setUserRole(body.userId, body.role);
  await recordAuditEvent({
    actorUserId: session.userId,
    actorIp: clientIpFrom(req),
    action: 'auth.register',
    targetType: 'user',
    targetId: body.userId,
    payload: { event: 'role_changed', newRole: body.role },
  });
  return NextResponse.json({ ok: true }, { status: 200 });
}
