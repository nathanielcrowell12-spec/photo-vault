'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  CreditCard,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Star,
  TrendingUp,
  Users,
  DollarSign,
  Crown,
  Shield,
  Zap
} from 'lucide-react'
import Link from 'next/link'
import { PHOTOGRAPHER_SUBSCRIPTION } from '@/lib/payment-models'
import { PaymentMethodManager } from '@/components/stripe'

interface SubscriptionData {
  status: 'active' | 'trial' | 'cancelled' | 'past_due'
  current_period_start: string
  current_period_end: string
  trial_end: string | null
  plan: 'professional'
  price: number
  next_billing_date: string
  payment_method: {
    type: string
    last4: string
    brand: string
  } | null
}

export default function SubscriptionPage() {
  const { user, userType } = useAuth()
  const router = useRouter()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userType !== 'photographer') {
      router.push('/dashboard')
      return
    }
    fetchSubscriptionData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userType])

  // Show loading or redirect if not photographer
  if (userType !== 'photographer') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground dark:text-foreground">Redirecting...</p>
        </div>
      </div>
    )
  }

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch('/api/stripe/platform-subscription')
      
      if (!response.ok) {
        // Handle any non-200 responses gracefully
        const errorData = await response.json().catch(() => ({}))
        console.warn('[Subscription] API returned error:', response.status, errorData)
        setSubscription(null)
        setLoading(false)
        return
      }

      const result = await response.json()
      
      // Handle both success with null data and success with data
      if (result.success) {
        if (result.data) {
          const data = result.data
          setSubscription({
            status: data.status === 'trialing' ? 'trial' : 
                    data.status === 'past_due' ? 'past_due' :
                    data.status === 'canceled' || data.status === 'cancelled' ? 'cancelled' :
                    'active',
            current_period_start: data.currentPeriodStart,
            current_period_end: data.currentPeriodEnd,
            trial_end: data.trialEnd,
            plan: 'professional',
            price: 22,
            next_billing_date: data.nextBillingDate,
            payment_method: data.paymentMethod
          })
        } else {
          // No subscription found - this is expected for new photographers
          setSubscription(null)
        }
      } else {
        // API returned success: false
        console.warn('[Subscription] API returned success: false:', result)
        setSubscription(null)
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error)
      // On error, set subscription to null so UI can show "no subscription" state
      setSubscription(null)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Active</Badge>
      case 'trial':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Free Trial</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Cancelled</Badge>
      case 'past_due':
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">Past Due</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getTrialDaysRemaining = (trialEnd: string) => {
    const now = new Date()
    const end = new Date(trialEnd)
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground dark:text-foreground">Loading subscription...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center space-x-2">
              <Crown className="h-6 w-6 text-purple-600" />
              <span className="text-xl font-bold">Subscription</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {subscription && getStatusBadge(subscription.status)}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {!subscription ? (
            <Card>
              <CardHeader>
                <CardTitle>No Active Subscription</CardTitle>
                <CardDescription>
                  You don't have an active platform subscription. Create one to get started.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/stripe/platform-subscription', {
                        method: 'POST',
                      })
                      if (response.ok) {
                        // Refresh subscription data
                        await fetchSubscriptionData()
                      } else {
                        const error = await response.json()
                        alert(`Failed to create subscription: ${error.error}`)
                      }
                    } catch (error) {
                      console.error('Error creating subscription:', error)
                      alert('Failed to create subscription. Please try again.')
                    }
                  }}
                >
                  Create Subscription
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Current Plan */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Crown className="h-6 w-6 text-purple-600" />
                    <span>Professional Plan</span>
                  </CardTitle>
                  <CardDescription>
                    Full access to PhotoVault platform and commission program
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        ${subscription.price}/month
                      </div>
                      <p className="text-muted-foreground dark:text-foreground mb-4">
                        Professional photo sharing platform with commission program
                      </p>
                      
                      {subscription.status === 'trial' && subscription.trial_end && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <Calendar className="h-5 w-5 text-blue-600" />
                            <span className="font-medium text-blue-800 dark:text-blue-200">
                              Free Trial
                            </span>
                          </div>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            {getTrialDaysRemaining(subscription.trial_end)} days remaining
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            Trial ends on {formatDate(subscription.trial_end)}
                          </p>
                        </div>
                      )}

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Unlimited client galleries</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Commission tracking system</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Advanced analytics & reporting</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>PDF report generation</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-4">Billing Information</h4>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="text-muted-foreground dark:text-muted-foreground">Status:</span>
                          <span className="ml-2">{getStatusBadge(subscription.status)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground dark:text-muted-foreground">Current Period:</span>
                          <span className="ml-2">
                            {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground dark:text-muted-foreground">Next Billing:</span>
                          <span className="ml-2">{formatDate(subscription.next_billing_date)}</span>
                        </div>
                        {subscription.payment_method && (
                          <div>
                            <span className="text-muted-foreground dark:text-muted-foreground">Payment Method:</span>
                            <span className="ml-2">
                              {subscription.payment_method.brand} •••• {subscription.payment_method.last4}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Commission Program Highlight */}
              <Card className="mb-8 border-2 border-green-200 dark:border-green-800">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-green-800 dark:text-green-200">
                    <DollarSign className="h-6 w-6" />
                    <span>Commission Program</span>
                  </CardTitle>
                  <CardDescription>
                    Your subscription includes access to our commission program
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                        Upfront Commission
                      </h4>
                      <div className="text-2xl font-bold text-green-600 mb-2">$25 or $50</div>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Earn $25 for 6-month packages ($50) or $50 for 1-year packages ($100)
                      </p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                        Monthly Commission
                      </h4>
                      <div className="text-2xl font-bold text-blue-600 mb-2">$4/month</div>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Earn $4/month passive income for every active client
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 text-center">
                    <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                      <strong>Example:</strong> 25 clients (1-year packages) = $1,250 upfront + $100/month passive income
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Platform Features */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Star className="h-6 w-6 text-yellow-600" />
                    <span>Platform Features</span>
                  </CardTitle>
                  <CardDescription>
                    Everything included in your Professional subscription
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {PHOTOGRAPHER_SUBSCRIPTION.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span className="text-slate-700 dark:text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Methods Section */}
              <PaymentMethodManager
                title="Payment Methods"
                description="Manage your payment methods for your $22/month PhotoVault subscription"
              />

              {/* Additional Actions */}
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Button
                  variant="outline"
                  asChild
                >
                  <Link href="/photographers/revenue">
                    <Shield className="h-4 w-4 mr-2" />
                    Billing History
                  </Link>
                </Button>
                {subscription.status !== 'cancelled' && (
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                    onClick={() => {
                      if (confirm('Are you sure you want to cancel your subscription? You will lose access to the photographer dashboard and commission program.')) {
                        alert('To cancel your subscription, please contact support@photovault.photo')
                      }
                    }}
                  >
                    Cancel Subscription
                  </Button>
                )}
              </div>

              {/* Help Section */}
              <Card className="mt-8">
                <CardContent className="p-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Need Help?</h3>
                    <p className="text-muted-foreground dark:text-foreground mb-4">
                      Our support team is here to help with any questions about your subscription or commission program.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button
                        variant="outline"
                        onClick={() => alert('Support system coming soon! For now, please email support@photovault.com')}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Contact Support
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href="/photographers/revenue">
                          <TrendingUp className="h-4 w-4 mr-2" />
                          View Revenue Dashboard
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
