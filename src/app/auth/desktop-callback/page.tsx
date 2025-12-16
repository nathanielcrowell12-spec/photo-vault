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

          console.log('[Desktop Callback] ✅ User authenticated:', session.user.email)

          // Get client_id if user is a client (for desktop app context)
          let clientId = ''
          try {
            const { data: profile } = await supabaseBrowser
              .from('user_profiles')
              .select('id, user_type')
              .eq('id', session.user.id)
              .single()

            if (profile?.user_type === 'client') {
              // Get client record
              const { data: client } = await supabaseBrowser
                .from('clients')
                .select('id')
                .eq('user_id', session.user.id)
                .single()

              if (client) {
                clientId = client.id
              }
            }
          } catch (e) {
            console.log('[Desktop Callback] Could not fetch client_id (may not be a client)')
          }

          // Send auth token to desktop app via protocol handler
          // Desktop app handles this in main.ts open-url and second-instance events
          const protocolUrl = `photovault://auth?token=${encodeURIComponent(session.access_token)}&userId=${encodeURIComponent(session.user.id)}${clientId ? `&clientId=${encodeURIComponent(clientId)}` : ''}`

          console.log('[Desktop Callback] Redirecting to desktop app...')

          // Small delay to show success message, then redirect
          setTimeout(() => {
            window.location.href = protocolUrl
          }, 1500)
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
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
                <span className="font-medium">Signed in as {userEmail}</span>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                  <span className="font-medium text-green-700 dark:text-green-300">
                    Opening Desktop App...
                  </span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-400">
                  The PhotoVault Desktop App will open automatically. You can close this tab.
                </p>
              </div>

              <Button onClick={handleRetry} variant="outline" className="w-full">
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
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
