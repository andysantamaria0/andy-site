import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { STAND_COOKIE, STAND_UNLOCK_PATH, standToken } from './lib/standAuth';

/**
 * Everything under /stand — pages, case-study screenshots, and the raw design
 * system HTML in public/stand — sits behind a shared password.
 */
async function standGate(request) {
  const { pathname } = request.nextUrl;

  // The unlock screen itself has to stay reachable.
  if (pathname === STAND_UNLOCK_PATH) return NextResponse.next();

  // standToken() is null when STAND_PASSWORD is unset — deny rather than allow.
  const expected = await standToken();
  const token = request.cookies.get(STAND_COOKIE)?.value;
  if (expected && token === expected) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = STAND_UNLOCK_PATH;
  url.search = '';
  url.searchParams.set('next', pathname);
  return NextResponse.redirect(url);
}

/**
 * /trips is the Vialoure app — Supabase session required, with a few public
 * entry points so an invited person can actually get in.
 */
async function tripsSession(request) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session — important for Server Components
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // If accessing /trips/* (but not login or auth callback) without a session, redirect to login
  if (
    pathname.startsWith('/trips') &&
    !pathname.startsWith('/trips/login') &&
    !pathname.startsWith('/trips/auth') &&
    !pathname.startsWith('/trips/join') &&
    !pathname.startsWith('/trips/not-invited') &&
    !user
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/trips/login';
    return NextResponse.redirect(url);
  }

  // If logged in and visiting login page, redirect to dashboard
  if (pathname === '/trips/login' && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/trips';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export async function middleware(request) {
  if (request.nextUrl.pathname.startsWith('/stand')) {
    return standGate(request);
  }
  return tripsSession(request);
}

export const config = {
  matcher: ['/trips/:path*', '/stand', '/stand/:path*'],
};
