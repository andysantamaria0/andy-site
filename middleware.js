import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

const PUBLIC_TRIPS_PATHS = [
  '/trips/login',
  '/trips/auth',
  '/trips/join',
  '/trips/not-invited',
  '/trips/icon',
  '/trips/apple-icon',
  '/trips/opengraph-image',
];

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

  // If accessing /trips/* without a session, redirect to login — except the
  // public entry points and the app's icon/OG files, which link unfurlers and
  // the PWA installer fetch without cookies.
  const isPublic = PUBLIC_TRIPS_PATHS.some((prefix) => pathname.startsWith(prefix));
  if (pathname.startsWith('/trips') && !isPublic && !user) {
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
  return tripsSession(request);
}

export const config = {
  matcher: ['/trips/:path*'],
};
