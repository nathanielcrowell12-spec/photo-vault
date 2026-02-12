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

  const { pathname } = req.nextUrl

  // === PUBLIC ROUTE CHECKS (no Supabase call needed) ===

  // Public page routes that don't require authentication
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
    '/login',
    '/reset-password',
    '/sitemap.xml',
    '/robots.txt',
    '/llms.txt',
    '/llms-full.txt',
  ]

  const isPublicRoute = publicRoutes.some(route => pathname === route)

  // Allow public routes immediately (no auth check needed)
  if (isPublicRoute) {
    return res
  }

  // Gallery pages are public (paywall handles access control)
  if (pathname.startsWith('/gallery/')) {
    return res
  }

  // Directory pages are public (photographer/location discovery)
  if (pathname.startsWith('/directory')) {
    return res
  }

  // Resource pages are public (SEO/GEO content)
  if (pathname.startsWith('/resources')) {
    return res
  }

  // Family invitation acceptance pages are public
  if (pathname.startsWith('/family/accept/')) {
    return res
  }

  // Allow webhook routes (Stripe needs to access these)
  if (pathname.startsWith('/api/webhooks') || pathname.startsWith('/api/stripe/webhook')) {
    return res
  }

  // Check for public API routes (before auth check)
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
      '/api/prompt', // Helm governance sync (prompt hash verification)
      '/api/helm/', // Helm report data endpoints (own auth via x-helm-api-key)
    ]

    const isPublicApi = publicApiRoutes.some(route => pathname.startsWith(route))
    if (isPublicApi) {
      return res
    }
  }

  // Signup payment page is public (user just signed up, not yet authenticated)
  if (pathname === '/signup/payment') {
    return res
  }

  // === AUTHENTICATED ROUTES (Supabase call required) ===

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

  // Get authenticated user - only called for protected routes
  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log('[Middleware] Request to:', pathname, 'User:', user?.email || 'none')

  // Check if user is authenticated
  if (!user) {
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
      // Secondary users go to family galleries, clients go to client dashboard
      redirectUrl.pathname = userType === 'secondary' ? '/family/galleries' : '/client/dashboard'
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Client routes
  if (pathname.startsWith('/client')) {
    // Allow photographers to preview client galleries
    const isGalleryPreview = pathname.startsWith('/client/gallery/')
    if (userType !== 'client' && userType !== 'admin' && !(userType === 'photographer' && isGalleryPreview)) {
      // Secondary users should go to family galleries
      if (userType === 'secondary') {
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = '/family/galleries'
        return NextResponse.redirect(redirectUrl)
      }
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/photographer/dashboard'
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Secondary users - restricted to family pages only
  if (userType === 'secondary') {
    const allowedSecondaryPaths = [
      '/family/galleries',
      '/family/takeover',
      '/gallery/', // Viewing individual galleries
      '/api/family/', // Family API endpoints
      '/logout',
      '/reset-password',
    ]

    const isAllowedPath = allowedSecondaryPaths.some(path => pathname.startsWith(path))

    if (!isAllowedPath && !pathname.startsWith('/api/')) {
      console.log('[Middleware] Secondary user restricted from:', pathname)
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/family/galleries'
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

  // Role-based API protection
  if (pathname.startsWith('/api')) {
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
     * - public folder (html, images, xml, txt, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/test-email|.*\\.(?:html|svg|png|jpg|jpeg|gif|webp|xml|txt|ico)$).*)',
  ],
}
