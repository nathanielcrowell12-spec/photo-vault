'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { supabaseBrowser } from '@/lib/supabase-browser'

function DesktopAuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, userType } = useAuth()
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'not_authenticated'>('checking')
  const [userEmail, setUserEmail] = useState<string>('')

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const handleAuthCallback = async () => {
      try {
        console.log('[Desktop Callback] Starting auth check...')
        console.log('[Desktop Callback] User from context:', user)

        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          console.log('[Desktop Callback] ⏱️ Auth check timeout - assuming not authenticated')
          if (authStatus === 'checking') {
            setAuthStatus('not_authenticated')
          }
        }, 5000)

        // Check Supabase session directly
        const { data: { session }, error } = await supabaseBrowser.auth.getSession()
        console.log('[Desktop Callback] Supabase session:', session)
        console.log('[Desktop Callback] Session error:', error)

        if (session && session.user) {
          clearTimeout(timeoutId)
          setAuthStatus('authenticated')
          setUserEmail(session.user.email || '')

          // TODO: Send auth token to desktop app via custom protocol or IPC
          // For now, just log it
          console.log('[Desktop Callback] ✅ User authenticated:', session.user.email)
          console.log('[Desktop Callback] User ID:', session.user.id)
          console.log('[Desktop Callback] Access Token:', session.access_token)

          // In the future, this would send data to the desktop app:
          // window.location.href = `photovault://auth?token=${session.access_token}&userId=${session.user.id}`
        } else if (user) {
          // Fall back to context user
          clearTimeout(timeoutId)
          setAuthStatus('authenticated')
          setUserEmail(user.email || '')
          console.log('[Desktop Callback] ✅ User from context:', user.email)
        } else {
          clearTimeout(timeoutId)
          setAuthStatus('not_authenticated')
          console.log('[Desktop Callback] ❌ No authenticated user found')
        }
      } catch (error) {
        console.error('[Desktop Callback] Error:', error)
        clearTimeout(timeoutId)
        setAuthStatus('not_authenticated')
      }
    }

    handleAuthCallback()

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [searchParams, user, authStatus])

  const handleRetry = () => {
    router.push('/client/upload')
  }

  const handleDownload = () => {
    router.push('/download-desktop-app')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {authStatus === 'checking' ? (
              <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
            ) : authStatus === 'authenticated' ? (
              <CheckCircle className="h-16 w-16 text-green-500" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl">Desktop App Authentication</CardTitle>
          <CardDescription>
            {authStatus === 'checking' ? 'Checking authentication...' : 'Complete authentication for PhotoVault Desktop App'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {authStatus === 'checking' ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Please wait while we verify your authentication...
              </p>
            </div>
          ) : authStatus === 'authenticated' ? (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Successfully authenticated as {userEmail}</span>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Next Steps:
                </h4>
                <ol className="text-sm text-blue-700 dark:text-blue-200 space-y-1 list-decimal list-inside text-left">
                  <li>Return to the PhotoVault Desktop App</li>
                  <li>The app should now show you&apos;re signed in</li>
                  <li>You can now upload your photos</li>
                </ol>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-left">
                <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2 text-sm">
                  🚧 Note: Authentication handoff not yet implemented
                </h4>
                <p className="text-xs text-yellow-700 dark:text-yellow-200">
                  The desktop app doesn&apos;t automatically receive your login yet.
                  Check the browser console for your auth token (F12 → Console tab).
                </p>
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
                <Button onClick={() => router.push('/')} className="w-full">
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

export default function DesktopAuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    }>
      <DesktopAuthCallbackContent />
    </Suspense>
  )
}
