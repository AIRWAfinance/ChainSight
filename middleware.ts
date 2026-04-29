import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const PROTECTED_ROUTES = ['/dashboard'];
const COOKIE_NAME = 'chainsight_session';

function getSecret(): Uint8Array | null {
  const secret = process.env['CHAINSIGHT_SESSION_SECRET'];
  if (!secret || secret.length < 32) return null;
  return new TextEncoder().encode(secret);
}

function applySecurityHeaders(res: NextResponse): NextResponse {
  // HSTS — only meaningful in production; harmless on http localhost.
  res.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains',
  );
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()',
  );
  res.headers.set('X-Frame-Options', 'DENY');
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const protectedRoute = PROTECTED_ROUTES.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );

  if (!protectedRoute) {
    return applySecurityHeaders(NextResponse.next());
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const secret = getSecret();
  if (!token || !secret) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return applySecurityHeaders(NextResponse.redirect(url));
  }

  try {
    await jwtVerify(token, secret);
    return applySecurityHeaders(NextResponse.next());
  } catch {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return applySecurityHeaders(NextResponse.redirect(url));
  }
}

export const config = {
  // Match all routes except Next.js internals + static assets so that
  // security headers are applied to HTML pages and API responses.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|otf|css|js)$).*)',
  ],
};
