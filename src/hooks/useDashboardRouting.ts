import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getDashboardRoute } from '@/lib/access-control'
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
      const dashboardRoute = getDashboardRoute(userType)
      if (dashboardRoute !== NAVIGATION_ROUTES.DASHBOARD) {
        setIsRedirecting(true)
        setRedirectMessage('Redirecting to your dashboard...')
        router.push(dashboardRoute)
        return
      }
    }

    setIsRedirecting(false)
  }, [user, userType, loading, router])

  const shouldShowLoading = loading || !userType || isRedirecting

  return {
    isRedirecting,
    shouldShowLoading,
    redirectMessage
  }
}
