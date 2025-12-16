'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Heart,
  Loader2,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Users,
  CreditCard,
  Crown,
  HandHeart,
  AlertTriangle,
  Camera,
} from 'lucide-react'
import Link from 'next/link'

interface EligibilityData {
  eligible: boolean
  error?: string
  accountId?: string
  primaryName?: string
  primaryEmail?: string
  galleryCount?: number
  accountStatus?: 'grace_period' | 'suspended' | 'active'
  monthsOverdue?: number
  secondaryId?: string
  relationship?: string
  alreadyTakenOver?: boolean
  currentBillingPayer?: string
}

type Step = 'loading' | 'error' | 'reason' | 'role' | 'payment' | 'success'

const REASONS = [
  { value: 'death', label: 'Death of account holder', description: "I'm sorry for your loss. We'll handle this with care." },
  { value: 'financial', label: 'Financial hardship', description: "We understand. You're helping preserve their memories." },
  { value: 'health', label: 'Health issues', description: "We hope they recover. You're helping preserve their memories." },
  { value: 'other', label: 'Other', description: 'Please tell us more (optional)' },
  { value: 'skip', label: 'Prefer not to say', description: "That's okay - you can proceed without providing a reason." },
]

function TakeoverPageContent() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const accountId = searchParams.get('account')
  const isSuccess = searchParams.get('success') === 'true'
  const isCancelled = searchParams.get('cancelled') === 'true'

  // State
  const [step, setStep] = useState<Step>('loading')
  const [eligibility, setEligibility] = useState<EligibilityData | null>(null)
  const [reason, setReason] = useState<string>('')
  const [reasonText, setReasonText] = useState<string>('')
  const [takeoverType, setTakeoverType] = useState<'full_primary' | 'billing_only'>('billing_only')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/family/takeover${accountId ? `?account=${accountId}` : ''}`)
    }
  }, [authLoading, user, router, accountId])

  // Handle success/cancel from Stripe
  useEffect(() => {
    if (isSuccess) {
      setStep('success')
    } else if (isCancelled) {
      setError('Payment was cancelled. You can try again.')
      setStep('payment')
    }
  }, [isSuccess, isCancelled])

  // Check eligibility
  useEffect(() => {
    async function checkEligibility() {
      if (!accountId || !user || isSuccess) return

      try {
        const res = await fetch(`/api/family/takeover?account=${accountId}`)
        const data = await res.json()

        setEligibility(data)

        if (!data.eligible) {
          setError(data.error || 'You are not eligible to take over this account')
          setStep('error')
        } else {
          setStep('reason')
        }
      } catch (err) {
        console.error('Error checking eligibility:', err)
        setError('Failed to check eligibility. Please try again.')
        setStep('error')
      }
    }

    if (user && accountId && !isSuccess) {
      checkEligibility()
    } else if (user && !accountId && !isSuccess) {
      setError('No account specified. Please use the link from your email.')
      setStep('error')
    }
  }, [user, accountId, isSuccess])

  // Process takeover
  async function handleProcessTakeover() {
    if (!accountId) return

    setProcessing(true)
    setError(null)

    try {
      const res = await fetch('/api/family/takeover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          takeoverType,
          reason: reason === 'skip' ? undefined : reason,
          reasonText: reason === 'other' ? reasonText : undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process takeover')
      }

      // Redirect to Stripe checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      }
    } catch (err) {
      console.error('Error processing takeover:', err)
      setError(err instanceof Error ? err.message : 'Failed to process takeover')
    } finally {
      setProcessing(false)
    }
  }

  function goToNextStep() {
    if (step === 'reason') {
      setStep('role')
    } else if (step === 'role') {
      setStep('payment')
    }
  }

  function goToPreviousStep() {
    if (step === 'role') {
      setStep('reason')
    } else if (step === 'payment') {
      setStep('role')
    }
  }

  // Loading state
  if (authLoading || step === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-pink-500 mx-auto" />
          <p className="mt-4 text-gray-600">Checking eligibility...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  // Success state
  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Takeover Complete!</CardTitle>
            <CardDescription>
              You are now {takeoverType === 'full_primary' ? 'the primary account holder' : 'the billing payer'} for this account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">What happens now:</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Access has been restored to all galleries</li>
                <li>• Your payment method is now on file</li>
                <li>• The photographer has been notified</li>
                {takeoverType === 'full_primary' && (
                  <li>• You can now manage all account settings</li>
                )}
              </ul>
            </div>
            <div className="flex gap-3">
              <Button asChild className="flex-1">
                <Link href="/client/dashboard">Go to Dashboard</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/family/galleries">View Galleries</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (step === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-orange-50 p-4">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Unable to Proceed</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            {eligibility?.alreadyTakenOver && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-amber-700">
                  <strong>{eligibility.currentBillingPayer}</strong> has already taken over billing for this account.
                  The account is now active and protected.
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <Button asChild variant="outline" className="flex-1">
                <Link href="/family/galleries">Back to Galleries</Link>
              </Button>
              <Button asChild className="flex-1">
                <Link href="/client/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main wizard
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/family/galleries"
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-pink-500 to-orange-400 rounded-xl">
                <HandHeart className="h-6 w-6 text-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Help Pay</h1>
                <p className="text-sm text-muted-foreground">
                  Take over billing for {eligibility?.primaryName || 'this account'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="container mx-auto px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            {['Reason', 'Role', 'Payment'].map((label, index) => {
              const stepIndex = ['reason', 'role', 'payment'].indexOf(step)
              const isActive = index === stepIndex
              const isComplete = index < stepIndex

              return (
                <div key={label} className="flex items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                    ${isComplete ? 'bg-green-500 text-foreground' : isActive ? 'bg-pink-500 text-foreground' : 'bg-gray-200 text-gray-500'}
                  `}>
                    {isComplete ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                  </div>
                  <span className={`ml-2 text-sm ${isActive ? 'font-semibold text-pink-600' : 'text-gray-500'}`}>
                    {label}
                  </span>
                  {index < 2 && (
                    <div className={`w-16 sm:w-24 h-1 mx-2 ${index < stepIndex ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 pb-8">
        <div className="max-w-2xl mx-auto">
          {/* Account Info Banner */}
          <div className="bg-white border border-pink-200 rounded-lg p-4 mb-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center text-foreground font-bold text-lg">
              {eligibility?.primaryName?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{eligibility?.primaryName || 'Account'}</h3>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Camera className="h-4 w-4" />
                  {eligibility?.galleryCount || 0} galleries
                </span>
                {eligibility?.accountStatus === 'suspended' && (
                  <span className="flex items-center gap-1 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    Suspended
                  </span>
                )}
                {eligibility?.accountStatus === 'grace_period' && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    Grace Period
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Step 1: Reason */}
          {step === 'reason' && (
            <Card>
              <CardHeader>
                <CardTitle>Why are you taking over?</CardTitle>
                <CardDescription>
                  This helps us provide better service and informs the photographer. You can skip this step.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={reason} onValueChange={setReason}>
                  {REASONS.map((r) => (
                    <div
                      key={r.value}
                      className={`
                        flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors
                        ${reason === r.value ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-pink-200'}
                      `}
                      onClick={() => setReason(r.value)}
                    >
                      <RadioGroupItem value={r.value} id={r.value} className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor={r.value} className="font-medium cursor-pointer">
                          {r.label}
                        </Label>
                        <p className="text-sm text-gray-500 mt-1">{r.description}</p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>

                {reason === 'other' && (
                  <div className="pl-7">
                    <Textarea
                      placeholder="Please share any additional context (optional)"
                      value={reasonText}
                      onChange={(e) => setReasonText(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={goToNextStep}
                    disabled={!reason}
                    className="bg-gradient-to-r from-pink-500 to-orange-500"
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Role */}
          {step === 'role' && (
            <Card>
              <CardHeader>
                <CardTitle>How would you like to help?</CardTitle>
                <CardDescription>
                  Choose your level of involvement with this account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={takeoverType} onValueChange={(v) => setTakeoverType(v as 'full_primary' | 'billing_only')}>
                  <div
                    className={`
                      flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors
                      ${takeoverType === 'billing_only' ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-pink-200'}
                    `}
                    onClick={() => setTakeoverType('billing_only')}
                  >
                    <RadioGroupItem value="billing_only" id="billing_only" className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-pink-500" />
                        <Label htmlFor="billing_only" className="font-medium cursor-pointer">
                          Just Pay the Bills
                        </Label>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Keep paying so everyone keeps access, but you don&apos;t need to manage the account.
                        The original account holder remains the &quot;owner&quot; and other family members keep their access.
                      </p>
                    </div>
                  </div>

                  <div
                    className={`
                      flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors
                      ${takeoverType === 'full_primary' ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-pink-200'}
                    `}
                    onClick={() => setTakeoverType('full_primary')}
                  >
                    <RadioGroupItem value="full_primary" id="full_primary" className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Crown className="h-5 w-5 text-amber-500" />
                        <Label htmlFor="full_primary" className="font-medium cursor-pointer">
                          Become the New Primary
                        </Label>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Take over this account completely. You&apos;ll be able to manage all settings,
                        invite your own family members, and control which galleries are shared.
                      </p>
                    </div>
                  </div>
                </RadioGroup>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={goToPreviousStep}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={goToNextStep}
                    className="bg-gradient-to-r from-pink-500 to-orange-500"
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Payment */}
          {step === 'payment' && (
            <Card>
              <CardHeader>
                <CardTitle>Complete Payment</CardTitle>
                <CardDescription>
                  Set up monthly billing to restore and maintain access to all galleries.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-card rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Order Summary</h4>
                  <div className="flex justify-between items-center">
                    <span>PhotoVault Monthly Subscription</span>
                    <span className="font-semibold">$8/month</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Protects {eligibility?.galleryCount || 0} galleries • Cancel anytime
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    What you&apos;ll get:
                  </h4>
                  <ul className="mt-2 text-sm text-green-700 space-y-1">
                    <li>• Immediate restoration of gallery access</li>
                    <li>• Protection of all family photos</li>
                    <li>• {takeoverType === 'full_primary' ? 'Full account management' : 'Billing management'}</li>
                    <li>• Peace of mind for the whole family</li>
                  </ul>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={goToPreviousStep}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleProcessTakeover}
                    disabled={processing}
                    className="bg-gradient-to-r from-pink-500 to-orange-500"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Proceed to Payment
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}

// Loading component for Suspense
function TakeoverPageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-pink-500 mx-auto" />
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  )
}

// Default export with Suspense boundary for useSearchParams
export default function TakeoverPage() {
  return (
    <Suspense fallback={<TakeoverPageLoading />}>
      <TakeoverPageContent />
    </Suspense>
  )
}
