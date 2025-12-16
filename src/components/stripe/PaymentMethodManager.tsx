'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  CreditCard,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Star,
} from 'lucide-react'
import { StripeProvider } from './StripeProvider'
import { PaymentMethodForm } from './PaymentMethodForm'

interface PaymentMethod {
  id: string
  brand: string
  last4: string
  expMonth: number
  expYear: number
  isDefault: boolean
}

interface PaymentMethodManagerProps {
  title?: string
  description?: string
  onPaymentMethodAdded?: () => void
}

/**
 * Full payment method management component
 * Shows saved cards, allows adding new ones, setting default, and deleting
 */
export function PaymentMethodManager({
  title = 'Payment Methods',
  description = 'Manage your saved payment methods',
  onPaymentMethodAdded,
}: PaymentMethodManagerProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null)

  // Fetch payment methods on mount
  useEffect(() => {
    fetchPaymentMethods()
  }, [])

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/stripe/setup-intent')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch payment methods')
      }

      setPaymentMethods(data.paymentMethods || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const createSetupIntent = async () => {
    try {
      const response = await fetch('/api/stripe/setup-intent', {
        method: 'POST',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create setup intent')
      }

      setClientSecret(data.clientSecret)
      setIsAddingNew(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handlePaymentMethodAdded = async () => {
    setIsAddingNew(false)
    setClientSecret(null)
    
    // Fetch updated payment methods
    try {
      const response = await fetch('/api/stripe/setup-intent')
      const data = await response.json()
      
      if (response.ok && data.paymentMethods?.length > 0) {
        setPaymentMethods(data.paymentMethods)
        
        // If no default payment method exists, automatically set the first one as default
        const hasDefault = data.paymentMethods.some((pm: PaymentMethod) => pm.isDefault)
        if (!hasDefault) {
          console.log('[PaymentMethodManager] No default found, setting first payment method as default')
          await setDefaultPaymentMethod(data.paymentMethods[0].id)
        }
      }
    } catch (err) {
      console.error('[PaymentMethodManager] Error fetching payment methods:', err)
      // Still call fetchPaymentMethods as fallback
      await fetchPaymentMethods()
    }
    
    onPaymentMethodAdded?.()
  }

  const setDefaultPaymentMethod = async (paymentMethodId: string) => {
    try {
      setSettingDefaultId(paymentMethodId)
      const response = await fetch('/api/stripe/setup-intent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to set default payment method')
      }

      // Update local state
      setPaymentMethods((prev) =>
        prev.map((pm) => ({
          ...pm,
          isDefault: pm.id === paymentMethodId,
        }))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSettingDefaultId(null)
    }
  }

  const deletePaymentMethod = async (paymentMethodId: string) => {
    try {
      setDeletingId(paymentMethodId)
      const response = await fetch('/api/stripe/setup-intent', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete payment method')
      }

      // Remove from local state
      setPaymentMethods((prev) => prev.filter((pm) => pm.id !== paymentMethodId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setDeletingId(null)
    }
  }

  // Card brand icons/formatting
  const formatBrand = (brand: string) => {
    const brands: Record<string, string> = {
      visa: 'Visa',
      mastercard: 'Mastercard',
      amex: 'American Express',
      discover: 'Discover',
      diners: 'Diners Club',
      jcb: 'JCB',
      unionpay: 'UnionPay',
    }
    return brands[brand.toLowerCase()] || brand
  }

  return (
    <Card className="border-2 border-amber-100 dark:border-amber-900/20 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-amber-600" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : paymentMethods.length === 0 && !isAddingNew ? (
          // No payment methods
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Payment Methods</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add a payment method to subscribe to PhotoVault services.
            </p>
            <Button onClick={createSetupIntent} className="bg-amber-500 hover:bg-amber-600 text-black">
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
          </div>
        ) : (
          // Payment methods list
          <div className="space-y-3">
            {paymentMethods.map((pm) => (
              <div
                key={pm.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white dark:bg-secondary rounded-lg flex items-center justify-center border">
                    <CreditCard className="h-5 w-5 text-muted-foreground dark:text-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatBrand(pm.brand)}</span>
                      <span className="text-muted-foreground">ending in {pm.last4}</span>
                      {pm.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Expires {pm.expMonth.toString().padStart(2, '0')}/{pm.expYear}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!pm.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDefaultPaymentMethod(pm.id)}
                      disabled={settingDefaultId === pm.id}
                    >
                      {settingDefaultId === pm.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Set as default'
                      )}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deletePaymentMethod(pm.id)}
                    disabled={deletingId === pm.id}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    {deletingId === pm.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}

            {!isAddingNew && (
              <Button
                variant="outline"
                onClick={createSetupIntent}
                className="w-full mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Payment Method
              </Button>
            )}
          </div>
        )}

        {/* Add New Payment Method Dialog */}
        {isAddingNew && clientSecret && (
          <div className="border-t pt-4 mt-4">
            <h4 className="font-medium mb-4">Add New Payment Method</h4>
            <StripeProvider clientSecret={clientSecret}>
              <PaymentMethodForm
                onSuccess={handlePaymentMethodAdded}
                onCancel={() => {
                  setIsAddingNew(false)
                  setClientSecret(null)
                }}
                buttonText="Save Card"
              />
            </StripeProvider>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PaymentMethodManager
