import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateUser } from '@/lib/auth/users';
import { signSession, setSessionCookie } from '@/lib/auth/session';

export const runtime = 'nodejs';

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: 'invalid_request', message: 'Email and password required' },
      { status: 400 },
    );
  }

  const user = await authenticateUser(parsed.email, parsed.password);
  if (!user) {
    return NextResponse.json(
      { error: 'invalid_credentials', message: 'Invalid email or password' },
      { status: 401 },
    );
  }
  const token = await signSession(user.id, user.email);
  await setSessionCookie(token);
  return NextResponse.json(
    { user: { id: user.id, email: user.email } },
    { status: 200 },
  );
}
