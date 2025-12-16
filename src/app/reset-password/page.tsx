'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [sessionError, setSessionError] = useState<string | null>(null)

  // Memoize the supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    // Extract tokens from URL hash
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)

    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    console.log('[ResetPassword] Hash params:', { hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken })

    if (!accessToken || !refreshToken) {
      setSessionError('Invalid or missing reset link. Please request a new password reset.')
      setInitializing(false)
      return
    }

    // Set the session using the tokens from the URL
    const initSession = async () => {
      try {
        // First check if there's already a valid session
        const { data: existingSession } = await supabase.auth.getSession()
        console.log('[ResetPassword] Existing session:', !!existingSession?.session)

        if (existingSession?.session) {
          // Already have a session, proceed
          console.log('[ResetPassword] Using existing session')
          setInitializing(false)
          return
        }

        console.log('[ResetPassword] Setting session from tokens...')
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        })

        console.log('[ResetPassword] Session result:', { hasData: !!data?.session, error: error?.message })

        if (error) {
          console.error('[ResetPassword] Session error:', error)
          setSessionError('This reset link has expired or is invalid. Please request a new one.')
        } else {
          console.log('[ResetPassword] Session set successfully')
        }
      } catch (err: any) {
        console.error('[ResetPassword] Error setting session:', err)
        setSessionError('Something went wrong. Please try again.')
      } finally {
        console.log('[ResetPassword] Initialization complete')
        setInitializing(false)
      }
    }

    initSession()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        throw error
      }

      setSuccess(true)
    } catch (err: any) {
      console.error('Password update error:', err)
      setError(err.message || 'Failed to update password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Loading state while initializing session
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Verifying your reset link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Session error state
  if (sessionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle>Link Expired or Invalid</CardTitle>
            <CardDescription>{sessionError}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <Link href="/login">
                <Button className="w-full" variant="outline">
                  Go to Login
                </Button>
              </Link>
              <p className="text-center text-sm text-muted-foreground">
                Need a new reset link? Use "Forgot Password" on the login page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Password Updated!</CardTitle>
            <CardDescription>
              Your password has been successfully changed. You can now log in with your new password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button className="w-full">
                Go to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Password reset form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Set Your Password</CardTitle>
          <CardDescription>
            Choose a secure password for your PhotoVault account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your new password"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Set Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
