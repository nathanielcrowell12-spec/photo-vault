'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

type UserType = 'photographer' | 'client' | 'admin' | 'secondary'

interface AuthRedirectOptions {
  /** The user type required to access this page. If not specified, any authenticated user is allowed. */
  requiredType?: UserType | UserType[]
  /** Custom redirect path for unauthenticated users. Defaults to '/login' */
  loginRedirect?: string
  /** Custom redirect paths based on user type when they don't have access */
  typeRedirects?: Partial<Record<UserType, string>>
  /** If true, skips the redirect logic entirely (useful for public pages that still want auth state) */
  skipRedirect?: boolean
}

interface AuthRedirectResult {
  /** The authenticated user, or null if not authenticated */
  user: ReturnType<typeof useAuth>['user']
  /** The user's type (photographer, client, admin, secondary) */
  userType: ReturnType<typeof useAuth>['userType']
  /** Whether the auth state is still loading */
  loading: boolean
  /** Whether the current user has access to this page */
  hasAccess: boolean
  /** Whether a redirect is in progress */
  isRedirecting: boolean
}

const DEFAULT_TYPE_REDIRECTS: Record<UserType, string> = {
  photographer: '/photographer/dashboard',
  client: '/client/dashboard',
  admin: '/admin/dashboard',
  secondary: '/client/dashboard',
}

/**
 * Custom hook to handle authentication redirects in a Next.js 15 + Turbopack compatible way.
 *
 * This hook encapsulates the common pattern of:
 * 1. Checking if user is authenticated
 * 2. Checking if user has the required type
 * 3. Redirecting to appropriate page if not
 *
 * IMPORTANT: This hook intentionally omits `router` from the useEffect dependency array.
 * Next.js 15 + Turbopack creates new router instances during HMR Fast Refresh, which
 * would cause infinite re-renders if router was included in dependencies.
 * Router methods (push, replace) are stable and don't need to trigger re-runs.
 *
 * @see https://nextjs.org/docs/app/api-reference/functions/use-router
 *
 * @example
 * // Require photographer access
 * const { user, loading, hasAccess } = useAuthRedirect({ requiredType: 'photographer' })
 *
 * @example
 * // Allow any authenticated user
 * const { user, loading, hasAccess } = useAuthRedirect()
 *
 * @example
 * // Allow multiple user types
 * const { user, loading, hasAccess } = useAuthRedirect({ requiredType: ['admin', 'photographer'] })
 */
export function useAuthRedirect(options: AuthRedirectOptions = {}): AuthRedirectResult {
  const {
    requiredType,
    loginRedirect = '/login',
    typeRedirects = {},
    skipRedirect = false,
  } = options

  const router = useRouter()
  const { user, userType, loading } = useAuth()

  // Track if we're currently redirecting to prevent multiple redirects
  const isRedirectingRef = useRef(false)

  // Determine if user has access
  const hasAccess = (() => {
    if (loading) return false
    if (!user) return false
    if (!requiredType) return true // Any authenticated user is allowed

    const allowedTypes = Array.isArray(requiredType) ? requiredType : [requiredType]
    return userType !== null && allowedTypes.includes(userType as UserType)
  })()

  useEffect(() => {
    // Skip if redirects are disabled or still loading
    if (skipRedirect || loading) return

    // Skip if already redirecting
    if (isRedirectingRef.current) return

    // Handle unauthenticated user
    if (!user) {
      isRedirectingRef.current = true
      router.push(loginRedirect)
      return
    }

    // Handle user type mismatch
    if (requiredType && userType !== null) {
      const allowedTypes = Array.isArray(requiredType) ? requiredType : [requiredType]

      if (!allowedTypes.includes(userType as UserType)) {
        isRedirectingRef.current = true
        // Get redirect path for user's actual type
        const redirectPath =
          typeRedirects[userType as UserType] ||
          DEFAULT_TYPE_REDIRECTS[userType as UserType] ||
          '/dashboard'
        router.push(redirectPath)
      }
    }

    // Reset redirecting flag when auth state stabilizes with access
    if (user && hasAccess) {
      isRedirectingRef.current = false
    }

    // IMPORTANT: router is intentionally omitted from dependencies.
    // Next.js 15 + Turbopack creates new router instances during HMR Fast Refresh.
    // Including router would cause infinite re-renders during development.
    // Router methods (push, replace) are stable and don't need to trigger re-runs.
    // See: https://nextjs.org/docs/app/api-reference/functions/use-router
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userType, loading, requiredType, loginRedirect, skipRedirect, hasAccess])

  return {
    user,
    userType,
    loading,
    hasAccess,
    isRedirecting: isRedirectingRef.current,
  }
}
