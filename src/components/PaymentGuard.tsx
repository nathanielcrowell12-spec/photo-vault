'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CreditCard, AlertCircle, Lock, DollarSign } from 'lucide-react'
import Link from 'next/link'

interface PaymentGuardProps {
  children: React.ReactNode
  requireActivePayment?: boolean
  showGracePeriodWarning?: boolean
}

export default function PaymentGuard({ 
  children, 
  requireActivePayment = false,
  showGracePeriodWarning = false 
}: PaymentGuardProps) {
  const { user, userType, paymentStatus, isPaymentActive, loading } = useAuth()
  const router = useRouter()
  const [isGracePeriod, setIsGracePeriod] = useState(false)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    if (!loading && user && userType === 'client') {
      checkPaymentStatus()
    }
  }, [loading, user, userType, paymentStatus, checkPaymentStatus])

  const checkPaymentStatus = () => {
    // Check if customer is in grace period (6 months after last payment)
    // or if payments stopped >6 months ago (expired)
    // This would typically check last_payment_date from the database
    
    // For now, we'll simulate based on payment_status
    if (paymentStatus === 'grace_period') {
      setIsGracePeriod(true)
    } else if (paymentStatus === 'inactive') {
      setIsExpired(true)
    }
  }

  // Don't show payment guards for photographers or admins
  if (userType === 'photographer' || userType === 'admin') {
    return <>{children}</>
  }

  // Show loading while checking payment status
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">Checking payment status...</p>
        </div>
      </div>
    )
  }

  // If payment is required but not active, show payment page
  if (requireActivePayment && !isPaymentActive) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-orange-600" />
            </div>
            <CardTitle>Payment Required</CardTitle>
            <CardDescription>
              Please complete your payment to access this feature
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your account requires an active subscription to access this area.
              </AlertDescription>
            </Alert>
            <Button asChild className="w-full">
              <Link href="/client/payment">
                <DollarSign className="h-4 w-4 mr-2" />
                Complete Payment
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard">
                Back to Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show grace period warning if enabled and customer is in grace period
  if (showGracePeriodWarning && isGracePeriod) {
    return (
      <>
        <Alert className="mb-6 border-orange-200 bg-orange-50 dark:bg-orange-900/20">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            <strong>Grace Period:</strong> Your payment is overdue. Please update your payment method to continue accessing your galleries.
            <Button asChild size="sm" className="ml-2">
              <Link href="/client/payment">Update Payment</Link>
            </Button>
          </AlertDescription>
        </Alert>
        {children}
      </>
    )
  }

  // Show expired warning if customer is >6 months past due
  if (isExpired) {
    return (
      <>
        <Alert className="mb-6 border-red-200 bg-red-50 dark:bg-red-900/20">
          <Lock className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            <strong>Account Inactive:</strong> Your subscription expired more than 6 months ago. 
            Please contact support to reactivate your account.
            <Button asChild size="sm" className="ml-2">
              <Link href="/client/support">Contact Support</Link>
            </Button>
          </AlertDescription>
        </Alert>
        {children}
      </>
    )
  }

  // Payment is active or not required - show children
  return <>{children}</>
}
