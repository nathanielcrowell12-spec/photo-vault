'use client'

import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { ReactNode } from 'react'

// Initialize Stripe - only once, cached
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
)

interface StripeProviderProps {
  children: ReactNode
  clientSecret?: string
  options?: {
    appearance?: {
      theme?: 'stripe' | 'night' | 'flat'
      variables?: Record<string, string>
      rules?: Record<string, Record<string, string>>
    }
  }
}

/**
 * Wraps children with Stripe Elements context
 * Use this when you need to render Stripe Elements
 */
export function StripeProvider({
  children,
  clientSecret,
  options,
}: StripeProviderProps) {
  // PhotoVault dark theme appearance
  const defaultAppearance = {
    theme: 'night' as const,
    variables: {
      colorPrimary: '#f59e0b', // PhotoVault gold
      colorBackground: '#262626', // neutral-800
      colorText: '#ffffff',
      colorDanger: '#ef4444',
      fontFamily: 'system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
    rules: {
      '.Input': {
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: 'none',
      },
      '.Input:focus': {
        border: '1px solid #f59e0b',
        boxShadow: '0 0 0 1px #f59e0b',
      },
      '.Label': {
        fontWeight: '500',
        marginBottom: '8px',
      },
    },
  }

  const elementsOptions = clientSecret
    ? {
        clientSecret,
        appearance: options?.appearance || defaultAppearance,
      }
    : {
        appearance: options?.appearance || defaultAppearance,
      }

  return (
    <Elements stripe={stripePromise} options={elementsOptions}>
      {children}
    </Elements>
  )
}

export default StripeProvider
