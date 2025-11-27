'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Eye,
  EyeOff,
  Lock,
  User,
  Mail,
  Camera,
  CheckCircle2,
  XCircle,
  CreditCard,
  DollarSign,
  Loader2,
  ExternalLink,
  AlertCircle,
  Banknote,
  PartyPopper
} from 'lucide-react'
import AccessGuard from '@/components/AccessGuard'

interface StripeConnectStatus {
  accountId: string | null
  status: string | null
  canReceivePayouts: boolean
  bankAccountVerified: boolean
  isConnected: boolean
}

function PhotographerSettingsContent() {
  const { user, userType, loading, changePassword } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChanging, setIsChanging] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
  })

  // Stripe Connect state
  const [stripeStatus, setStripeStatus] = useState<StripeConnectStatus | null>(null)
  const [stripeLoading, setStripeLoading] = useState(true)
  const [stripeConnecting, setStripeConnecting] = useState(false)
  const [stripeError, setStripeError] = useState('')
  const [stripeSuccess, setStripeSuccess] = useState(false)

  useEffect(() => {
    if (!loading && (!user || userType !== 'photographer')) {
      router.push('/login')
    }
  }, [loading, user, userType, router])

  // Check for Stripe return status
  useEffect(() => {
    const stripeParam = searchParams.get('stripe')
    if (stripeParam === 'success') {
      setStripeSuccess(true)
      fetchStripeStatus()
    } else if (stripeParam === 'refresh') {
      setStripeError('Stripe onboarding was not completed. Please try again.')
    }
  }, [searchParams])

  // Fetch Stripe Connect status
  useEffect(() => {
    if (user && userType === 'photographer') {
      fetchStripeStatus()
    }
  }, [user, userType])

  const fetchStripeStatus = async () => {
    try {
      setStripeLoading(true)
      const response = await fetch('/api/stripe/connect/authorize')
      const data = await response.json()

      if (response.ok && data.success) {
        setStripeStatus(data.data)
      }
    } catch (error) {
      console.error('Error fetching Stripe status:', error)
    } finally {
      setStripeLoading(false)
    }
  }

  const handleConnectStripe = async () => {
    setStripeConnecting(true)
    setStripeError('')

    try {
      const response = await fetch('/api/stripe/connect/authorize', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create Stripe account')
      }

      // Redirect to Stripe onboarding
      if (data.data?.onboardingUrl) {
        window.location.href = data.data.onboardingUrl
      }
    } catch (error) {
      setStripeError(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setStripeConnecting(false)
    }
  }

  useEffect(() => {
    // Validate password requirements
    setPasswordRequirements({
      minLength: newPassword.length >= 8,
      hasUppercase: /[A-Z]/.test(newPassword),
      hasLowercase: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
    })
  }, [newPassword])

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (!passwordRequirements.hasUppercase || !passwordRequirements.hasLowercase || !passwordRequirements.hasNumber) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one number')
      return
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password')
      return
    }

    setIsChanging(true)

    try {
      // Note: Supabase doesn't require current password for updateUser
      // In production, you might want to verify current password first
      const { error: changeError } = await changePassword(newPassword)

      if (changeError) {
        setError(changeError instanceof Error ? changeError.message : 'Failed to change password. Please try again.')
      } else {
        setSuccess('Password changed successfully!')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(''), 5000)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      console.error('Password change error:', err)
    } finally {
      setIsChanging(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!user || userType !== 'photographer') {
    return null
  }

  return (
    <AccessGuard requiredAccess="canAccessPhotographerDashboard">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100">
        {/* Header */}
        <header className="border-b bg-white/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-4">
              <Camera className="h-10 w-10 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold">Account Settings</h1>
                <p className="text-sm text-slate-600">
                  Manage your photographer account preferences and security settings
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Stripe Success Alert */}
            {stripeSuccess && (
              <Alert className="bg-green-50 border-green-200">
                <PartyPopper className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Stripe account connected successfully!</strong> You can now receive commission payouts.
                </AlertDescription>
              </Alert>
            )}

            {/* Stripe Connect - FIRST for visibility */}
            <Card className="border-2 border-green-100 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-green-600" />
                  Payment Settings
                </CardTitle>
                <CardDescription>
                  Connect your bank account to receive commission payouts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {stripeLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  </div>
                ) : stripeStatus?.isConnected ? (
                  // Connected State
                  <div className="space-y-4">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-green-800 dark:text-green-200">
                            Stripe Connected
                          </h4>
                          <p className="text-sm text-green-700 dark:text-green-300">
                            Your bank account is verified and ready to receive payouts
                          </p>
                        </div>
                        <Badge className="ml-auto bg-green-600">Active</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                        <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Commission Rate</div>
                        <div className="text-2xl font-bold text-green-600">50%</div>
                        <div className="text-xs text-slate-500">of client payments</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                        <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Payout Schedule</div>
                        <div className="text-2xl font-bold text-blue-600">14 days</div>
                        <div className="text-xs text-slate-500">after payment received</div>
                      </div>
                    </div>

                    <div className="text-center pt-2">
                      <a
                        href="https://dashboard.stripe.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        Manage in Stripe Dashboard
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                ) : stripeStatus?.status === 'pending' ? (
                  // Pending State - Onboarding started but not completed
                  <div className="space-y-4">
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-800 rounded-full flex items-center justify-center">
                          <AlertCircle className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-amber-800 dark:text-amber-200">
                            Setup Incomplete
                          </h4>
                          <p className="text-sm text-amber-700 dark:text-amber-300">
                            Complete your Stripe onboarding to receive payouts
                          </p>
                        </div>
                        <Badge variant="outline" className="ml-auto border-amber-500 text-amber-700">
                          Pending
                        </Badge>
                      </div>
                    </div>

                    <Button
                      onClick={handleConnectStripe}
                      disabled={stripeConnecting}
                      className="w-full bg-amber-600 hover:bg-amber-700"
                    >
                      {stripeConnecting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Redirecting...
                        </>
                      ) : (
                        <>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Complete Stripe Setup
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  // Not Connected State
                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 text-center">
                      <div className="w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <DollarSign className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Start Earning Commissions</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        Connect your Stripe account to receive 50% commission on every client subscription.
                      </p>

                      <div className="grid grid-cols-2 gap-3 mb-4 text-left">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                          <span className="text-sm">$50 per Year 1 client</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                          <span className="text-sm">$4/month ongoing</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                          <span className="text-sm">Direct bank deposits</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                          <span className="text-sm">14-day payout cycle</span>
                        </div>
                      </div>
                    </div>

                    {stripeError && (
                      <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 flex items-center gap-2">
                        <XCircle className="h-4 w-4 flex-shrink-0" />
                        {stripeError}
                      </div>
                    )}

                    <Button
                      onClick={handleConnectStripe}
                      disabled={stripeConnecting}
                      className="w-full bg-green-600 hover:bg-green-700"
                      size="lg"
                    >
                      {stripeConnecting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Connect Stripe Account
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-slate-500">
                      You&apos;ll be redirected to Stripe to complete secure account setup.
                      Takes about 5 minutes.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card className="border-2 border-blue-100 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Account Information
                </CardTitle>
                <CardDescription>
                  Your account details and email address
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      value={user.email || ''}
                      disabled
                      className="bg-slate-50"
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Contact support to change your email address
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card className="border-2 border-blue-100 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-blue-600" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter your current password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter your new password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {newPassword && (
                      <div className="space-y-1 text-xs">
                        <div className={`flex items-center gap-2 ${passwordRequirements.minLength ? 'text-green-600' : 'text-slate-500'}`}>
                          {passwordRequirements.minLength ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          At least 8 characters
                        </div>
                        <div className={`flex items-center gap-2 ${passwordRequirements.hasUppercase ? 'text-green-600' : 'text-slate-500'}`}>
                          {passwordRequirements.hasUppercase ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          One uppercase letter
                        </div>
                        <div className={`flex items-center gap-2 ${passwordRequirements.hasLowercase ? 'text-green-600' : 'text-slate-500'}`}>
                          {passwordRequirements.hasLowercase ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          One lowercase letter
                        </div>
                        <div className={`flex items-center gap-2 ${passwordRequirements.hasNumber ? 'text-green-600' : 'text-slate-500'}`}>
                          {passwordRequirements.hasNumber ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          One number
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your new password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      {success}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isChanging}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isChanging ? 'Changing Password...' : 'Change Password'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AccessGuard>
  )
}

// Main export with Suspense boundary for useSearchParams
export default function PhotographerSettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <PhotographerSettingsContent />
    </Suspense>
  )
}

