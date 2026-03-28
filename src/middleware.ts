import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';

const publicRoutes = ['/login', '/recuperar', '/reset-password', '/api/public'];

export async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const isPublicRoute = publicRoutes.some(route => nextUrl.pathname.startsWith(route));
  const session = request.cookies.get('session')?.value;

  // 1. If trying to access a protected route without session -> REDIRECT TO LOGIN
  if (!isPublicRoute && !session) {
    return NextResponse.redirect(new URL('/login', nextUrl));
  }

  // 2. If trying to access login while already authenticated -> REDIRECT TO DASHBOARD
  if (isPublicRoute && session && nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  // 3. Validation of the token if exists (optional but recommended for security)
  if (session) {
    try {
      await decrypt(session);
    } catch (e) {
      // Invalid token -> Clear cookie and redirect to login
      const response = NextResponse.redirect(new URL('/login', nextUrl));
      response.cookies.delete('session');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  // Protect all routes except next internals, static files, and icons
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
