import { NextResponse } from 'next/server';
import { z } from 'zod';
import { registerUser } from '@/lib/auth/users';
import { signSession, setSessionCookie } from '@/lib/auth/session';

export const runtime = 'nodejs';

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(8),
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

  try {
    const user = await registerUser(parsed.email, parsed.password);
    const token = await signSession(user.id, user.email);
    await setSessionCookie(token);
    return NextResponse.json(
      { user: { id: user.id, email: user.email } },
      { status: 201 },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Registration failed';
    const status = /already registered/.test(msg) ? 409 : 400;
    return NextResponse.json({ error: 'register_failed', message: msg }, { status });
  }
}
