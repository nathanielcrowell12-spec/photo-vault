import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getDashboardRoute, UserType } from '@/lib/access-control'
import { NAVIGATION_ROUTES } from '@/lib/component-constants'

interface UseDashboardRoutingReturn {
  isRedirecting: boolean
  shouldShowLoading: boolean
  redirectMessage: string
}

export function useDashboardRouting(
  user: unknown,
  userType: string | null,
  loading: boolean
): UseDashboardRoutingReturn {
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [redirectMessage, setRedirectMessage] = useState('')

  useEffect(() => {
    if (loading) return

    if (!user) {
      setIsRedirecting(true)
      setRedirectMessage('Redirecting to login...')
      router.push(NAVIGATION_ROUTES.LOGIN)
      return
    }

    if (userType) {
      const dashboardRoute = getDashboardRoute(userType as UserType)
      if (dashboardRoute !== NAVIGATION_ROUTES.DASHBOARD) {
        setIsRedirecting(true)
        setRedirectMessage('Redirecting to your dashboard...')
        router.push(dashboardRoute)
        return
      }
    }

    setIsRedirecting(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userType, loading])

  const shouldShowLoading = loading || !userType || isRedirecting

  return {
    isRedirecting,
    shouldShowLoading,
    redirectMessage
  }
}
