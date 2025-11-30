'use client'

import { useState, useEffect } from 'react'
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface PaymentMethodFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  buttonText?: string
  returnUrl?: string
}

/**
 * Payment Method Form using Stripe PaymentElement
 * Must be wrapped in StripeProvider with clientSecret
 */
export function PaymentMethodForm({
  onSuccess,
  onCancel,
  buttonText = 'Add Payment Method',
  returnUrl,
}: PaymentMethodFormProps) {
  const stripe = useStripe()
  const elements = useElements()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { error: submitError } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: returnUrl || `${window.location.origin}/photographers/settings?stripe=payment-success`,
        },
        redirect: 'if_required',
      })

      if (submitError) {
        setError(submitError.message || 'An error occurred')
      } else {
        setSuccess(true)
        onSuccess?.()
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      console.error('[PaymentMethodForm] Error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Payment Method Added</h3>
        <p className="text-sm text-muted-foreground">
          Your payment method has been saved successfully.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
          layout: 'tabs',
        }}
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={!stripe || !elements || isLoading}
          className="flex-1 bg-amber-500 hover:bg-amber-600 text-black"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            buttonText
          )}
        </Button>
      </div>
    </form>
  )
}

export default PaymentMethodForm
