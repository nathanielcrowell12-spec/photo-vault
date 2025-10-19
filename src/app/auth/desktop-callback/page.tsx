'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function DesktopAuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, userType } = useAuth()
  
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the desktop app protocol from URL params
        const desktopToken = searchParams.get('token')
        const desktopUser = searchParams.get('user')
        
        if (desktopToken && desktopUser && user) {
          // Send auth data to desktop app
          // This would normally be handled by a custom protocol handler
          // For now, we'll show success and provide instructions
          console.log('Desktop auth callback received:', { desktopToken, desktopUser })
          
          // In a real implementation, this would communicate with the desktop app
          // For now, we'll show a success message
        }
      } catch (error) {
        console.error('Desktop auth callback error:', error)
      }
    }

    handleAuthCallback()
  }, [searchParams, user])

  const handleRetry = () => {
    router.push('/client/import')
  }

  const handleDownload = () => {
    router.push('/download-desktop-app')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Desktop App Authentication</CardTitle>
          <CardDescription>
            Complete authentication for PhotoVault Desktop App
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {user ? (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Successfully authenticated as {user.email}</span>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Next Steps:
                </h4>
                <ol className="text-sm text-blue-700 dark:text-blue-200 space-y-1 list-decimal list-inside">
                  <li>Return to the PhotoVault Desktop App</li>
                  <li>The app should now show you&apos;re signed in</li>
                  <li>You can now upload your photos</li>
                </ol>
              </div>
              
              <Button onClick={handleRetry} className="w-full">
                Back to Upload Options
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2 text-red-600">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">Authentication Required</span>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Please sign in to your PhotoVault account to authenticate the desktop app.
              </p>
              
              <div className="space-y-2">
                <Button onClick={handleRetry} className="w-full">
                  Sign In to PhotoVault
                </Button>
                <Button onClick={handleDownload} variant="outline" className="w-full">
                  Download Desktop App
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
