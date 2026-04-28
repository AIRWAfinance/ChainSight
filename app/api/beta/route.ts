import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendBetaSignup } from '@/lib/notify/email';

export const runtime = 'nodejs';

const Body = z.object({
  email: z.string().email(),
  role: z.string().max(120).optional(),
  company: z.string().max(120).optional(),
  notes: z.string().max(1000).optional(),
});

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'invalid_request', message: err instanceof Error ? err.message : 'Invalid body' },
      { status: 400 },
    );
  }

  console.log(
    `[beta] signup: email=${parsed.email} role=${parsed.role ?? '-'} company=${parsed.company ?? '-'}`,
  );

  // Best-effort notify: emails the inbox configured in BETA_INBOX_EMAIL
  // (falls back to SMTP_USER if not set). If SMTP isn't configured the
  // signup is still recorded in server logs and the user gets a 200.
  await sendBetaSignup(parsed).catch((err) => {
    console.error('[beta] notify failed:', err);
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
