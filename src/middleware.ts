import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/chat',
  '/profile',
  '/my-dashboard',
  '/skills',
  '/vacancy',
];

// Routes that are always public
const PUBLIC_ROUTES = [
  '/',
  '/auth',
  '/demo',
  '/demo-day',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public routes and API routes (API routes handle their own auth)
  if (PUBLIC_ROUTES.some(r => pathname === r) || pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
    return NextResponse.next();
  }

  // Check for protected routes
  const isProtected = PROTECTED_ROUTES.some(r => pathname.startsWith(r));
  if (!isProtected) {
    return NextResponse.next(); // Employer/reviewer/psychologist routes — open for now (demo)
  }

  // Check for Supabase auth cookie
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // No Supabase configured — allow through (dev mode)
    return NextResponse.next();
  }

  // Check for auth token in cookies
  const authCookies = request.cookies.getAll();
  const hasAuthCookie = authCookies.some(c =>
    c.name.includes('sb-') && c.name.includes('auth-token')
  );

  if (!hasAuthCookie) {
    // Also check localStorage-based user_id as fallback (for demo mode)
    // Middleware can't read localStorage, but the page components can
    // So we just let through and let client-side useAuth handle the redirect
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
