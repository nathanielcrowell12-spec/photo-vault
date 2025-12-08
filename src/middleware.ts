import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // eslint-disable-next-line prefer-const
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
        },
      },
    }
  )

  // Get authenticated user - this validates the session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = req.nextUrl

  console.log('[Middleware] Request to:', pathname, 'User:', user?.email || 'none')

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/financial-model',
    '/application',
    '/download-desktop-app',
    '/signup',
    '/auth/signup',
    '/photographers/signup',
    '/auth/desktop-callback',
    '/connect',
    '/logout',
  ]

  // Gallery pages are public (paywall handles access control)
  if (pathname.startsWith('/gallery/')) {
    console.log('[Middleware] Public gallery access:', pathname)
    return res
  }

  // Directory pages are public (photographer/location discovery)
  if (pathname.startsWith('/directory')) {
    console.log('[Middleware] Public directory access:', pathname)
    return res
  }

  // Family invitation acceptance pages are public
  if (pathname.startsWith('/family/accept/')) {
    console.log('[Middleware] Public family accept access:', pathname)
    return res
  }

  // Family galleries and takeover pages require auth (handled below)
  // Just log it for now
  if (pathname.startsWith('/family/galleries') || pathname.startsWith('/family/takeover')) {
    console.log('[Middleware] Family page access:', pathname)
  }

  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith('/api/health'))

  // Allow webhook routes (Stripe needs to access these)
  if (pathname.startsWith('/api/webhooks') || pathname.startsWith('/api/stripe/webhook')) {
    return res
  }

  // Check for public API routes first (before auth check)
  if (pathname.startsWith('/api')) {
    const publicApiRoutes = [
      '/api/health',
      '/api/test-env',
      '/api/test-supabase',
      '/api/webhooks', // Legacy webhooks
      '/api/stripe/webhook', // Stripe webhooks
      '/api/stripe/public-checkout', // Public checkout (no auth required)
      '/api/cron', // Cron jobs
      '/api/auth/check-session', // Desktop app auth check
      '/api/auth/logout', // Logout endpoint
      '/api/v1/upload', // Desktop app uploads
      '/api/gallery/', // Public gallery API for paywall
      '/api/family/secondaries/accept', // Family invitation acceptance
      '/api/directory/', // Public directory API for locations and photographers
    ]

    const isPublicApi = publicApiRoutes.some(route => pathname.startsWith(route))
    if (isPublicApi) {
      return res
    }
  }

  // Allow access to login page
  if (pathname === '/login') {
    return res
  }

  // Allow public routes
  if (isPublicRoute) {
    return res
  }

  // Check if user is authenticated
  if (!user) {
    // Allow signup payment page without auth (user just signed up)
    if (pathname === '/signup/payment') {
      return res
    }

    // Redirect to login for protected routes (NOT API routes)
    if (!pathname.startsWith('/api')) {
      console.log('[Middleware] No user, redirecting to login from:', pathname)
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // For API routes, return 401 instead of redirecting
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[Middleware] User authenticated:', user.email, 'accessing:', pathname)

  // Get user profile to check role
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('user_type')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('[Middleware] Profile fetch error:', {
      error: profileError,
      userId: user.id,
      pathname
    })
  }

  const userType = profile?.user_type

  // If we couldn't fetch the profile, allow the request but log it
  if (!userType && !profileError) {
    console.warn('[Middleware] No user type found for user:', user.id)
  }

  // Role-based route protection

  // Photographer routes
  if (pathname.startsWith('/photographer') || pathname.startsWith('/photographers')) {
    if (userType !== 'photographer' && userType !== 'admin') {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/client/dashboard'
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Client routes
  if (pathname.startsWith('/client')) {
    // Allow photographers to preview client galleries
    const isGalleryPreview = pathname.startsWith('/client/gallery/')
    if (userType !== 'client' && userType !== 'admin' && !(userType === 'photographer' && isGalleryPreview)) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/photographer/dashboard'
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Admin routes - only admins allowed
  if (pathname.startsWith('/admin')) {
    if (userType !== 'admin') {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/dashboard'
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Test/Debug routes - only in development
  const testRoutes = [
    '/test-dashboard',
    '/test-images',
    '/dev-dashboard',
    '/debug',
  ]

  if (testRoutes.some(route => pathname.startsWith(route))) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // API route protection
  if (pathname.startsWith('/api')) {
    // Public API routes
    const publicApiRoutes = [
      '/api/health',
      '/api/test-env',
      '/api/test-supabase',
      '/api/webhooks', // Legacy webhooks
      '/api/stripe/webhook', // Stripe webhooks
      '/api/cron', // Cron jobs
      '/api/auth/check-session', // Desktop app auth check
      '/api/auth/logout', // Logout endpoint
      '/api/v1/upload', // Desktop app uploads
    ]

    const isPublicApi = publicApiRoutes.some(route => pathname.startsWith(route))

    if (!isPublicApi && !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Role-based API protection
    if (pathname.startsWith('/api/admin') && userType !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    if (pathname.startsWith('/api/revenue') || pathname.startsWith('/api/sessions')) {
      if (userType !== 'photographer' && userType !== 'admin') {
        return NextResponse.json(
          { error: 'Forbidden - Photographer access required' },
          { status: 403 }
        )
      }
    }
  }

  return res
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder (html, images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/test-email|.*\\.(?:html|svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
