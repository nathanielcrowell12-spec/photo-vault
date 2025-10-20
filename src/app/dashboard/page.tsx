'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useDashboardRouting } from '@/hooks/useDashboardRouting'
import { DashboardLoadingCard } from '@/components/dashboard/DashboardLoadingCard'

export default function DashboardPage() {
  const { user, userType, loading } = useAuth()
  const { isRedirecting, shouldShowLoading, redirectMessage } = useDashboardRouting(user, userType, loading)

  if (shouldShowLoading) {
    const title = loading ? 'Loading Dashboard' : isRedirecting ? 'Redirecting...' : 'Setting Up Your Account'
    const description = loading 
      ? 'Redirecting you to your personalized dashboard...' 
      : isRedirecting 
        ? redirectMessage
        : 'Please wait while we configure your account...'

    return <DashboardLoadingCard title={title} description={description} />
  }

  // This should rarely be reached, but provides fallback feedback
  return (
    <DashboardLoadingCard 
      title="Dashboard" 
      description="Welcome to your dashboard. If you're seeing this, please refresh the page." 
      showSpinner={false} 
    />
  )
}