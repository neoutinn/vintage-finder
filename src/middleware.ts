import { NextRequest, NextResponse } from 'next/server';

/**
 * Basic Auth gate for the hosted deployment. Only the real, reachable-from-
 * the-internet deployment needs this — the Electron desktop server never
 * leaves 127.0.0.1 (see VINTAGE_FINDER_LOCAL in electron/main.ts), and
 * plain local dev (`npm run dev`) is developer-only by definition
 * (NODE_ENV=development, set automatically by Next.js).
 */
export function middleware(request: NextRequest) {
  if (process.env.VINTAGE_FINDER_LOCAL === '1' || process.env.NODE_ENV !== 'production') {
    return NextResponse.next();
  }

  const password = process.env.SITE_PASSWORD;
  if (!password) {
    // Fail closed: a production deployment with no password configured
    // should never silently serve requests unauthenticated.
    return new NextResponse('SITE_PASSWORD is not configured on this deployment.', { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Basic ')) {
    const decoded = Buffer.from(authHeader.slice('Basic '.length), 'base64').toString('utf-8');
    const suppliedPassword = decoded.split(':')[1];
    if (suppliedPassword === password) {
      return NextResponse.next();
    }
  }

  // Username is ignored — leave it blank or type anything, only the
  // password field is checked.
  return new NextResponse('Authentication required.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Vintage Finder"' },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
