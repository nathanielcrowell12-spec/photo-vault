'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, CreditCard, Lock } from 'lucide-react'

interface SubscribeButtonProps {
  galleryId: string
  photographerId: string
  galleryName?: string
  variant?: 'default' | 'outline' | 'secondary'
  size?: 'default' | 'sm' | 'lg'
  className?: string
  showPrice?: boolean
}

/**
 * SubscribeButton - Initiates Stripe Checkout for gallery access
 *
 * Usage:
 * <SubscribeButton
 *   galleryId="uuid"
 *   photographerId="uuid"
 *   galleryName="Smith Wedding"
 * />
 */
export function SubscribeButton({
  galleryId,
  photographerId,
  galleryName,
  variant = 'default',
  size = 'default',
  className = '',
  showPrice = true,
}: SubscribeButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubscribe = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          galleryId,
          photographerId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong'
      setError(errorMessage)
      console.error('[SubscribeButton] Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        onClick={handleSubscribe}
        disabled={loading}
        variant={variant}
        size={size}
        className={`${className} ${variant === 'default' ? 'bg-green-600 hover:bg-green-700' : ''}`}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Redirecting to checkout...
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4 mr-2" />
            {showPrice ? 'Subscribe - $8/month' : 'Subscribe to Access'}
          </>
        )}
      </Button>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {!error && !loading && (
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Lock className="h-3 w-3" />
          <span>Secure payment via Stripe</span>
        </div>
      )}
    </div>
  )
}

/**
 * SubscribeCard - Full card component for subscription CTA
 */
interface SubscribeCardProps {
  galleryId: string
  photographerId: string
  galleryName: string
  photographerName?: string
  photoCount?: number
}

export function SubscribeCard({
  galleryId,
  photographerId,
  galleryName,
  photographerName,
  photoCount,
}: SubscribeCardProps) {
  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center">
      <div className="mb-4">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="h-8 w-8 text-green-600 dark:text-green-300" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Subscribe to Access Photos
        </h3>
        <p className="text-slate-600 dark:text-slate-300 text-sm">
          {galleryName}
          {photographerName && ` by ${photographerName}`}
          {photoCount && ` • ${photoCount} photos`}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-4">
        <div className="text-3xl font-bold text-green-600 mb-1">$8<span className="text-lg">/month</span></div>
        <p className="text-xs text-slate-500">After first year ($100 upfront)</p>
      </div>

      <ul className="text-left text-sm space-y-2 mb-6">
        <li className="flex items-center gap-2">
          <span className="text-green-500">✓</span>
          <span>Unlimited photo downloads</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="text-green-500">✓</span>
          <span>Access from any device</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="text-green-500">✓</span>
          <span>Share with family & friends</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="text-green-500">✓</span>
          <span>Photos stored forever</span>
        </li>
      </ul>

      <SubscribeButton
        galleryId={galleryId}
        photographerId={photographerId}
        galleryName={galleryName}
        size="lg"
        className="w-full"
      />

      <p className="text-xs text-slate-500 mt-4">
        Cancel anytime. No questions asked.
      </p>
    </div>
  )
}

export default SubscribeButton
