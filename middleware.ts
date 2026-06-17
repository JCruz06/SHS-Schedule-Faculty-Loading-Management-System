import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from './lib/supabaseServer';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const { client: supabase, response: updatedResponse } = createMiddlewareClient(request, response);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const url = request.nextUrl.clone();

  const isProtectedPath =
    url.pathname.startsWith('/dashboard') ||
    url.pathname.startsWith('/teachers') ||
    url.pathname.startsWith('/strands') ||
    url.pathname.startsWith('/subjects') ||
    url.pathname.startsWith('/schedule') ||
    url.pathname.startsWith('/conflicts') ||
    url.pathname.startsWith('/faculty-loading') ||
    url.pathname.startsWith('/reports');

  if (isProtectedPath && !session) {
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  if (url.pathname === '/auth/login' && session) {
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  if (url.pathname === '/') {
    url.pathname = session ? '/dashboard' : '/auth/login';
    return NextResponse.redirect(url);
  }

  return updatedResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|assets).*)',
  ],
};
