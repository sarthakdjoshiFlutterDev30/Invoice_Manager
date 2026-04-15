import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login'];
const PUBLIC_API_PATHS = ['/api/auth/login', '/api/auth/logout', '/api/auth/me'];

// ── Edge-compatible JWT verification ──────────────────────────
// jsonwebtoken uses Node.js crypto which is NOT available in the
// Edge Runtime. We verify the HS256 signature using Web Crypto API.
async function verifyJWT(token: string, secret: string): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, sigB64] = parts;

    // Import the secret key
    const enc = new TextEncoder();
    const keyData = enc.encode(secret);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Verify signature
    const signingInput = `${headerB64}.${payloadB64}`;
    const signature = Uint8Array.from(
      atob(sigB64.replace(/-/g, '+').replace(/_/g, '/')),
      c => c.charCodeAt(0)
    );

    const valid = await crypto.subtle.verify(
      'HMAC',
      cryptoKey,
      signature,
      enc.encode(signingInput)
    );

    if (!valid) return null;

    // Decode payload
    const payloadJson = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson);

    // Check expiry
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always pass through static assets and public API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/logo') ||
    pathname.startsWith('/public') ||
    PUBLIC_API_PATHS.some(p => pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get('auth_token')?.value;
  const secret = process.env.JWT_SECRET || 'bytesflare-invoice-manager-secret-key-2024';

  const payload = token ? await verifyJWT(token, secret) : null;
  const isAuthenticated = !!payload;

  // Authenticated user hitting /login → send to dashboard
  if (isAuthenticated && PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Unauthenticated user hitting a protected page → send to login
  if (!isAuthenticated && !PUBLIC_PATHS.includes(pathname) && !pathname.startsWith('/api/')) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Unauthenticated API call → 401
  if (!isAuthenticated && pathname.startsWith('/api/')) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  // Inject user headers for authenticated API/page requests
  if (isAuthenticated && payload) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-id', String(payload.id ?? ''));
    requestHeaders.set('x-user-email', String(payload.email ?? ''));
    requestHeaders.set('x-user-role', String(payload.role ?? ''));
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
