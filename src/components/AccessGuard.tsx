'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Shield, Lock } from 'lucide-react'
import { getUserAccessRules, getDashboardRoute } from '@/lib/access-control'

interface AccessGuardProps {
  children: React.ReactNode
  requiredAccess: keyof ReturnType<typeof getUserAccessRules>
  fallbackRoute?: string
  showAccessDenied?: boolean
}

export default function AccessGuard({ 
  children, 
  requiredAccess, 
  fallbackRoute,
  showAccessDenied = true 
}: AccessGuardProps) {
  const { user, userType, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    
    if (!user) {
      router.push('/login')
      return
    }

    const accessRules = getUserAccessRules(user.email, userType)
    
    if (!accessRules[requiredAccess]) {
      const redirectRoute = fallbackRoute || getDashboardRoute(userType)
      router.push(redirectRoute)
      return
    }
  }, [user, userType, loading, requiredAccess, fallbackRoute, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking access permissions...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to access this page</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/login')}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const accessRules = getUserAccessRules(user.email, userType)
  
  if (!accessRules[requiredAccess]) {
    if (!showAccessDenied) {
      return null
    }

    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Lock className="h-12 w-12 mx-auto mb-4 text-orange-500" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don&apos;t have permission to access this page
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-sm text-gray-600">
              <p><strong>Logged in as:</strong> {user.email}</p>
              <p><strong>User Type:</strong> {userType}</p>
              <p><strong>Required Access:</strong> {requiredAccess}</p>
            </div>
            <Button onClick={() => router.push(getDashboardRoute(userType))}>
              Go to Your Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
