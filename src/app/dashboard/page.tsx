'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { getDashboardRoute } from '@/lib/access-control'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  const { user, userType, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
        return
      }
      
      // Only redirect if we have a valid user type
      if (userType && userType !== null) {
        const dashboardRoute = getDashboardRoute(userType)
        if (dashboardRoute !== '/dashboard') {
          router.push(dashboardRoute)
        }
      }
      // If userType is null, stay on this page and show loading
    }
  }, [user, userType, loading, router])

  if (loading || !userType) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{loading ? 'Loading Dashboard' : 'Setting Up Your Account'}</CardTitle>
            <CardDescription>
              {loading ? 'Redirecting you to your personalized dashboard...' : 'Please wait while we configure your account...'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}