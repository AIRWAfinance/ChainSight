import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const PROTECTED_ROUTES = ['/dashboard'];
const COOKIE_NAME = 'chainsight_session';

function getSecret(): Uint8Array | null {
  const secret = process.env['CHAINSIGHT_SESSION_SECRET'];
  if (!secret || secret.length < 32) return null;
  return new TextEncoder().encode(secret);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const protectedRoute = PROTECTED_ROUTES.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );
  if (!protectedRoute) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const secret = getSecret();
  if (!token || !secret) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
