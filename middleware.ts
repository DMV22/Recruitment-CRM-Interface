import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';

const PROTECTED_ROUTES = [
  '/dashboard',
  '/clients',
  '/vacancies',
  '/candidates',
  '/submissions',
  '/team'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route));

  // Secure protected routes -> redirect to /sign-in if not authenticated 
  if (isProtected) {
    const session = await getSession();

    if (!session?.user) {
      const signInUrl = new URL('/sign-in', request.url);
      signInUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Redirect authenticated users away from /sign-in and /sign-up
  if (pathname === '/sign-in' || pathname === '/sign-up') {
    const session = await getSession();
    if (session?.user) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    ...PROTECTED_ROUTES.map(route => `${route}/:path*`),
    '/sign-in',
    '/sign-up',
  ],
};