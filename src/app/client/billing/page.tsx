'use client'

import { useState, useEffect, Suspense } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  ArrowLeft,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  Loader2,
  ExternalLink,
  Camera,
  RefreshCw,
  Sparkles,
  Shield,
  Download,
  Share2,
  PartyPopper
} from 'lucide-react'
import Link from 'next/link'
import { supabaseBrowser as supabase } from '@/lib/supabase-browser'
import { PaymentMethodManager } from '@/components/stripe'

interface Subscription {
  id: string
  stripe_subscription_id: string
  status: 'active' | 'past_due' | 'canceled' | 'trialing' | 'inactive'
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  gallery_id: string
  gallery_name?: string
  photographer_name?: string
  // Grace period tracking
  last_payment_failure_at?: string
  payment_failure_count?: number
  access_suspended?: boolean
  access_suspended_at?: string
}

interface PaymentHistory {
  id: string
  amount_paid_cents: number
  currency: string
  status: string
  paid_at: string
}

function ClientBillingContent() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [payments, setPayments] = useState<PaymentHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState(false)
  const [subscriptionSuccess, setSubscriptionSuccess] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState<string | null>(null)
  const [reactivatingId, setReactivatingId] = useState<string | null>(null)

  // Check for success redirect
  useEffect(() => {
    if (searchParams.get('subscription') === 'success') {
      setSubscriptionSuccess(true)
    }
  }, [searchParams])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      fetchBillingData()
    }
  }, [user, authLoading])

  const fetchBillingData = async () => {
    try {
      setLoading(true)

      // Fetch subscriptions - table may not exist yet if Stripe not configured
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select(`
          id,
          stripe_subscription_id,
          status,
          current_period_start,
          current_period_end,
          cancel_at_period_end,
          gallery_id,
          last_payment_failure_at,
          payment_failure_count,
          access_suspended,
          access_suspended_at
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      // Don't throw on missing table - just show empty state
      if (subError && !subError.message?.includes('does not exist')) {
        console.warn('Subscriptions query issue:', subError.message)
      }

      // Enrich with gallery data
      const enrichedSubs = await Promise.all(
        (subData || []).map(async (sub) => {
          const { data: galleryData } = await supabase
            .from('photo_galleries')
            .select('gallery_name, photographer_id')
            .eq('id', sub.gallery_id)
            .single()

          let photographerName = 'Unknown'
          if (galleryData?.photographer_id) {
            const { data: photoData } = await supabase
              .from('photographers')
              .select('business_name')
              .eq('id', galleryData.photographer_id)
              .single()
            photographerName = photoData?.business_name || 'Unknown'
          }

          return {
            ...sub,
            gallery_name: galleryData?.gallery_name || 'Unknown Gallery',
            photographer_name: photographerName
          }
        })
      )

      setSubscriptions(enrichedSubs)

      // Fetch payment history
      const { data: paymentData, error: paymentError } = await supabase
        .from('payment_history')
        .select('id, amount_paid_cents, currency, status, paid_at')
        .order('paid_at', { ascending: false })
        .limit(10)

      if (!paymentError) {
        setPayments(paymentData || [])
      }
    } catch (error) {
      // Silently handle - empty state UI will show
      // This is expected when subscriptions/payment_history tables don't exist yet
      console.log('[Billing] No billing data available yet')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async (subscriptionId: string) => {
    try {
      setCancellingId(subscriptionId)
      
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription')
      }
      
      // Refresh billing data
      await fetchBillingData()
      setShowCancelConfirm(null)
    } catch (error) {
      console.error('[Billing] Error cancelling subscription:', error)
      alert(error instanceof Error ? error.message : 'Failed to cancel subscription. Please try again.')
    } finally {
      setCancellingId(null)
    }
  }

  const handleReactivateSubscription = async (subscriptionId: string) => {
    try {
      setReactivatingId(subscriptionId)
      
      const response = await fetch('/api/stripe/reactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reactivate subscription')
      }
      
      // If needs payment, redirect to checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
        return
      }
      
      // Otherwise refresh billing data
      await fetchBillingData()
    } catch (error) {
      console.error('[Billing] Error reactivating subscription:', error)
      alert(error instanceof Error ? error.message : 'Failed to reactivate subscription. Please try again.')
    } finally {
      setReactivatingId(null)
    }
  }

  const handleSubscribeDirectMonthly = async () => {
    try {
      setSubscribing(true)

      const response = await fetch('/api/stripe/create-direct-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription')
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('[Billing] Error creating subscription:', error)
      alert(error instanceof Error ? error.message : 'Failed to create subscription. Please try again.')
    } finally {
      setSubscribing(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (cents: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(cents / 100)
  }

  // Calculate grace period remaining (6 months from first failure)
  const getGracePeriodInfo = (sub: Subscription) => {
    if (!sub.last_payment_failure_at) return null
    
    const GRACE_PERIOD_MONTHS = 6
    const firstFailure = new Date(sub.last_payment_failure_at)
    const graceEndDate = new Date(firstFailure)
    graceEndDate.setMonth(graceEndDate.getMonth() + GRACE_PERIOD_MONTHS)
    
    const now = new Date()
    const msRemaining = graceEndDate.getTime() - now.getTime()
    
    if (msRemaining <= 0) {
      return { expired: true, daysRemaining: 0, monthsRemaining: 0, graceEndDate }
    }
    
    const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000))
    const monthsRemaining = Math.floor(daysRemaining / 30)
    const extraDays = daysRemaining % 30
    
    return { 
      expired: false, 
      daysRemaining, 
      monthsRemaining, 
      extraDays,
      graceEndDate 
    }
  }

  const getStatusBadge = (status: string, cancelAtPeriodEnd: boolean) => {
    if (cancelAtPeriodEnd) {
      return <Badge variant="outline" className="border-amber-500 text-amber-700">Canceling</Badge>
    }

    switch (status) {
      case 'active':
        return <Badge className="bg-green-600">Active</Badge>
      case 'past_due':
        return <Badge className="bg-red-600">Past Due</Badge>
      case 'canceled':
        return <Badge variant="secondary">Canceled</Badge>
      case 'trialing':
        return <Badge className="bg-blue-600">Trial</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/client/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center space-x-2">
              <CreditCard className="h-6 w-6 text-green-600" />
              <span className="text-xl font-bold text-foreground">Billing & Subscriptions</span>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchBillingData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Getting Started Instructions - Only show when no active subscriptions */}
          {subscriptions.length === 0 && (
            <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
              <CardContent className="py-6">
                <h2 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-3">
                  Getting Started
                </h2>
                <ol className="list-decimal list-inside space-y-2 text-purple-800 dark:text-purple-200">
                  <li><strong>Register a payment method</strong> below to enable subscriptions</li>
                  <li><strong>Subscribe</strong> to activate your PhotoVault account ($8/month)</li>
                </ol>
              </CardContent>
            </Card>
          )}

          {/* Payment Methods - FIRST so users can add payment before subscribing */}
          <section>
            <PaymentMethodManager
              title="Payment Methods"
              description="Add a payment method to enable subscriptions"
            />
          </section>

          {/* Active Subscriptions */}
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
              <Camera className="h-5 w-5 text-purple-600" />
              Your Subscriptions
            </h2>

            {/* Subscription Success Message */}
            {subscriptionSuccess && (
              <Card className="bg-card/50 border-border mb-6">
                <CardContent className="py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <PartyPopper className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        Welcome to PhotoVault!
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Your subscription is now active. You can start uploading and organizing your photos.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {subscriptions.length === 0 ? (
              <div className="space-y-6">
                {/* Direct Monthly Subscription Card */}
                <Card className="bg-card/50 border-border">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        <CardTitle>PhotoVault Monthly</CardTitle>
                      </div>
                      <Badge className="bg-purple-600">$8/month</Badge>
                    </div>
                    <CardDescription>
                      Unlimited photo storage for your personal collection
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Features */}
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[
                        { icon: Camera, text: 'Unlimited photo galleries' },
                        { icon: Download, text: 'High-resolution downloads' },
                        { icon: Share2, text: 'Share with family & friends' },
                        { icon: Shield, text: 'Photos stored securely forever' },
                      ].map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <feature.icon className="h-4 w-4 text-purple-600" />
                          <span>{feature.text}</span>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    {/* Subscribe Button */}
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <Button
                        onClick={handleSubscribeDirectMonthly}
                        disabled={subscribing}
                        className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700"
                        size="lg"
                      >
                        {subscribing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Setting up...
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Subscribe Now - $8/month
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center sm:text-left">
                        Cancel anytime. No hidden fees.
                      </p>
                    </div>

                    {/* Security Note */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card p-3 rounded-lg">
                      <Shield className="h-4 w-4" />
                      <span>Secure payment powered by Stripe. Your card details are never stored on our servers.</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Alternative: Already have a photographer? */}
                <Card className="bg-card/50 border-border">
                  <CardContent className="py-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-3">
                        Working with a photographer? They may have already set up a gallery for you.
                      </p>
                      <Button asChild variant="outline" size="sm">
                        <Link href="/client/dashboard">
                          <Camera className="h-4 w-4 mr-2" />
                          Check Your Galleries
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="space-y-4">
                {subscriptions.map((sub) => (
                  <Card key={sub.id} className="bg-card/50 border-border">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">{sub.gallery_name}</h3>
                            {getStatusBadge(sub.status, sub.cancel_at_period_end)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            by {sub.photographer_name}
                          </p>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>Renews {formatDate(sub.current_period_end)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              <span>$8/month</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          {!sub.access_suspended && (
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/gallery/${sub.gallery_id}`}>
                                <Camera className="h-4 w-4 mr-2" />
                                View Gallery
                              </Link>
                            </Button>
                          )}
                          {sub.status === 'active' && !sub.cancel_at_period_end && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setShowCancelConfirm(sub.id)}
                            >
                              Cancel Subscription
                            </Button>
                          )}
                        </div>
                      </div>

                      {sub.status === 'past_due' && !sub.access_suspended && (
                        <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                            <div className="flex-1">
                              <h4 className="font-medium text-amber-800 dark:text-amber-200">
                                Payment Failed - Grace Period Active
                              </h4>
                              {(() => {
                                const graceInfo = getGracePeriodInfo(sub)
                                return graceInfo ? (
                                  <div className="mt-2">
                                    <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                                      {graceInfo.monthsRemaining > 0 
                                        ? `${graceInfo.monthsRemaining} month${graceInfo.monthsRemaining !== 1 ? 's' : ''}${graceInfo.extraDays ? ` ${graceInfo.extraDays} day${graceInfo.extraDays !== 1 ? 's' : ''}` : ''}`
                                        : `${graceInfo.daysRemaining} day${graceInfo.daysRemaining !== 1 ? 's' : ''}`
                                      } remaining
                                    </div>
                                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">
                                      <strong>You still have full access to your photos.</strong> Update your payment method anytime 
                                      before {formatDate(graceInfo.graceEndDate.toISOString())} to continue without interruption. 
                                      No back payments required.
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                    Your payment didn&apos;t go through. You have a 6-month grace period to update your payment method.
                                  </p>
                                )
                              })()}
                              <Button size="sm" className="mt-3 bg-amber-600 hover:bg-amber-700">
                                Update Payment Method
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {sub.access_suspended && (
                        <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                            <div className="flex-1">
                              <h4 className="font-medium text-red-800 dark:text-red-200">
                                Access Suspended - Reactivation Required
                              </h4>
                              <p className="text-sm text-red-700 dark:text-red-300 mt-2">
                                Your 6-month grace period has ended. <strong>Your photos are still safely stored</strong> and 
                                will never be deleted. To regain access:
                              </p>
                              <ul className="text-sm text-red-700 dark:text-red-300 mt-2 list-disc list-inside space-y-1">
                                <li>Pay a $20 reactivation fee</li>
                                <li>Get 30 days to decide your next step</li>
                                <li>Resume $8/month subscription, OR download your photos</li>
                              </ul>
                              <Button 
                                size="sm" 
                                className="mt-3 bg-red-600 hover:bg-red-700"
                                onClick={() => handleReactivateSubscription(sub.stripe_subscription_id)}
                                disabled={reactivatingId === sub.stripe_subscription_id}
                              >
                                {reactivatingId === sub.stripe_subscription_id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  'Reactivate Access - $20'
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {sub.cancel_at_period_end && (
                        <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-amber-800 dark:text-amber-200">
                                Subscription Ending
                              </h4>
                              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                Your subscription will end on {formatDate(sub.current_period_end)}.
                                You&apos;ll lose access to your photos after this date.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Payment History */}
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
              <DollarSign className="h-5 w-5 text-green-600" />
              Payment History
            </h2>

            {payments.length === 0 ? (
              <Card className="bg-card/50 border-border">
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No payment history yet.</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-card/50 border-border">
                <CardContent className="p-0">
                  <div className="divide-y dark:divide-slate-700">
                    {payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-4 hover:bg-card"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            payment.status === 'succeeded'
                              ? 'bg-green-100 dark:bg-green-900'
                              : 'bg-red-100 dark:bg-red-900'
                          }`}>
                            {payment.status === 'succeeded' ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-red-600" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">
                              {payment.status === 'succeeded' ? 'Payment Successful' : 'Payment Failed'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(payment.paid_at)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${
                            payment.status === 'succeeded' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(payment.amount_paid_cents, payment.currency)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </section>

          {/* Help Section */}
          <Card className="bg-card/50 border-border">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2 text-foreground">Need Help?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                If you have questions about billing or need to make changes to your subscription,
                our support team is here to help.
              </p>
              <Button asChild variant="outline">
                <a href="mailto:support@photovault.photo">
                  Contact Support
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Cancel Subscription Confirmation Dialog */}
      <AlertDialog open={!!showCancelConfirm} onOpenChange={() => setShowCancelConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                If you cancel, you&apos;ll enter a <strong>6-month grace period</strong> where you can 
                still access your photos and resume your subscription anytime without penalty.
              </p>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm">
                <strong className="text-amber-800 dark:text-amber-200">Your photos are never deleted.</strong>
                <p className="text-amber-700 dark:text-amber-300 mt-1">
                  After the grace period, you&apos;ll need to pay a $20 reactivation fee to access them again.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                const sub = subscriptions.find(s => s.id === showCancelConfirm)
                if (sub) handleCancelSubscription(sub.stripe_subscription_id)
              }}
              disabled={!!cancellingId}
            >
              {cancellingId ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Yes, Cancel Subscription'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Main export with Suspense boundary for useSearchParams
export default function ClientBillingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ClientBillingContent />
    </Suspense>
  )
}
