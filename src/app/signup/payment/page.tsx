'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, CreditCard, Shield, Lock, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function PaymentPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [processingPayment, setProcessingPayment] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading])

  const handleStripePayment = async () => {
    setProcessingPayment(true)
    setError('')

    try {
      const response = await fetch('/api/stripe/create-direct-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to start checkout. Please try again.')
        return
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        setError('Unable to create checkout session. Please try again.')
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setProcessingPayment(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="container-pixieset py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <CreditCard className="h-7 w-7 text-primary" />
              <span className="text-xl font-semibold tracking-tight">PhotoVault</span>
            </Link>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              Secure Checkout
            </Badge>
          </div>
        </div>
      </header>

      <main className="container-pixieset py-12">
        <div className="max-w-4xl mx-auto">
          {/* Welcome */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-semibold mb-4 text-foreground tracking-tight">
              Complete Your Setup
            </h1>
            <p className="text-lg text-muted-foreground font-light">
              Start your PhotoVault subscription to access all your photos
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Pricing Card */}
            <div className="lg:col-span-2">
              <Card className="card-shadow border border-border">
                <CardHeader className="bg-gradient-to-br from-primary/10 to-secondary/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">PhotoVault Subscription</CardTitle>
                      <CardDescription>Unlimited photo storage and access</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-primary">$8</div>
                      <div className="text-sm text-muted-foreground">per month</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  {/* Features */}
                  <div className="space-y-4 mb-8">
                    <h3 className="font-semibold text-foreground mb-4">What&apos;s Included:</h3>
                    {[
                      'Unlimited photo storage',
                      'Connect to all photographer platforms',
                      'Automatic organization and timeline',
                      'Download high-resolution photos',
                      'Share galleries with family',
                      'Mobile app access',
                      'Premium support',
                      'Lifetime access to your photos'
                    ].map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span className="text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {error && (
                    <Alert variant="destructive" className="mb-6">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Payment Button */}
                  <Button
                    onClick={handleStripePayment}
                    disabled={processingPayment}
                    className="w-full btn-primary py-6 text-lg"
                    size="lg"
                  >
                    {processingPayment ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Redirecting to checkout...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5 mr-3" />
                        Start Subscription - $8/month
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground mt-4">
                    Secure payment powered by Stripe. Cancel anytime.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Security Info */}
            <div className="space-y-6">
              <Card className="card-shadow border border-border">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Secure & Safe
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Lock className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Bank-Level Security</p>
                      <p className="text-muted-foreground text-xs">
                        Your payment info is encrypted and never stored on our servers
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Cancel Anytime</p>
                      <p className="text-muted-foreground text-xs">
                        No long-term commitment. Cancel with one click.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CreditCard className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Money-Back Guarantee</p>
                      <p className="text-muted-foreground text-xs">
                        Not satisfied? Get a full refund within 30 days.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-shadow border border-border bg-gradient-to-br from-primary/10 to-secondary/30">
                <CardContent className="p-6">
                  <h4 className="font-semibold text-foreground mb-3">💡 Why $8/month?</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    We split revenue with your photographers to help them grow their business.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your $8 supports both unlimited photo storage AND helps your photographer thrive.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

