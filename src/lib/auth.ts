import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'bytesflare-invoice-manager-secret-key-2024';
const JWT_EXPIRY = '7d';

export const signToken = (payload: Record<string, string | number>) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};

export const setAuthCookie = async (token: string) => {
  const cookieStore = await cookies();
  cookieStore.set({
    name: 'auth_token',
    value: token,
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
};

export const getAuthToken = async () => {
  const cookieStore = await cookies();
  return cookieStore.get('auth_token')?.value;
};

export const removeAuthCookie = async () => {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
};

export const getCurrentUser = async () => {
  const token = await getAuthToken();
  if (!token) return null;
  
  const decoded = verifyToken(token);
  return decoded;
};

export const getCurrentUserFromHeaders = (headers: Headers) => {
  const userId = headers.get('x-user-id');
  const userEmail = headers.get('x-user-email');
  const userRole = headers.get('x-user-role');

  console.log('Headers in getCurrentUserFromHeaders:', {
    'x-user-id': userId,
    'x-user-email': userEmail,
    'x-user-role': userRole
  });

  if (!userId || !userEmail || !userRole) {
    console.log('Missing user headers');
    return null;
  }

  return {
    id: userId,
    email: userEmail,
    role: userRole,
  };
};

export const isAuthenticated = async (req: NextRequest) => {
  const token = req.cookies.get('auth_token')?.value;
  
  if (!token) {
    return false;
  }
  
  const decoded = verifyToken(token);
  return !!decoded;
};

export const authMiddleware = async (req: NextRequest) => {
  const isAuthPath = req.nextUrl.pathname.startsWith('/api/auth');
  const isPublicPath = req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/register';
  
  const isAuthed = await isAuthenticated(req);
  
  if (!isAuthed && !isPublicPath && !isAuthPath) {
    const url = new URL('/login', req.url);
    url.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  
  if (isAuthed && isPublicPath) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  
  return NextResponse.next();
};