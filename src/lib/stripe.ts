/**
 * Stripe Configuration & Utilities
 *
 * Server-side Stripe instance - DO NOT use on client
 * For client-side, use @stripe/stripe-js with publishable key
 *
 * CRITICAL: Uses lazy initialization to prevent Stripe from being instantiated
 * during Vercel's build phase when environment variables may not be available.
 */

import Stripe from 'stripe'

// Cached Stripe instance
let stripeInstance: Stripe | null = null

/**
 * Get Stripe client - lazy initialization on first use
 * This prevents build-time errors when STRIPE_SECRET_KEY is not available
 */
export function getStripeClient(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.warn('⚠️  STRIPE_SECRET_KEY not set. Stripe features will not work.')
      console.warn('📖 See STRIPE-SETUP-GUIDE.md for setup instructions')
      // Return a mock or throw - for now we'll create with empty string to maintain compatibility
    }

    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-09-30.clover',
      typescript: true,
    })
  }

  return stripeInstance
}

// Export for backward compatibility - but this is lazy now
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripeClient()[prop as keyof Stripe]
  }
})

/**
 * Pricing Plans
 *
 * CLIENT PRICING MODEL:
 * - Year 1: $100 upfront (or $50 for 6-month package)
 * - Year 2+: $8/month ongoing subscription
 *
 * PHOTOGRAPHER COMMISSION (50/50 split):
 * - Year 1: $50 upfront commission (from $100 payment)
 * - Year 2+: $4/month passive income (from $8/month payment)
 */
export const PRICING = {
  // Year 1 upfront packages
  CLIENT_YEAR_1: {
    amount: 10000, // $100.00 in cents
    currency: 'usd',
    interval: 'year' as const,
  },
  CLIENT_6_MONTH: {
    amount: 5000, // $50.00 in cents
    currency: 'usd',
    interval: 'month' as const, // 6-month package, billed once
  },
  // Year 2+ monthly subscription
  CLIENT_MONTHLY: {
    amount: 800, // $8.00 in cents
    currency: 'usd',
    interval: 'month' as const,
  },
} as const

/**
 * Stripe Price IDs from environment
 * These are created in Stripe Dashboard → Products
 */
export const STRIPE_PRICES = {
  CLIENT_MONTHLY: process.env.STRIPE_CLIENT_MONTHLY_PRICE_ID || '',
} as const

/**
 * Stripe Connect Client ID for photographer onboarding
 */
export const STRIPE_CONNECT_CLIENT_ID = process.env.STRIPE_CONNECT_CLIENT_ID || ''

/**
 * Commission rate for photographers (50% flat rate)
 * PhotoVault uses a 50/50 split: photographers get 50%, platform gets 50%
 *
 * Examples:
 * - Year 1: Client pays $100 → Photographer gets $50, PhotoVault gets $50
 * - Year 2+: Client pays $8/month → Photographer gets $4/month, PhotoVault gets $4/month
 */
export const PHOTOGRAPHER_COMMISSION_RATE = 0.50

/**
 * Create a Stripe Checkout session for subscriptions
 */
export async function createCheckoutSession({
  priceId,
  customerId,
  customerEmail,
  metadata,
  successUrl,
  cancelUrl,
}: {
  priceId: string
  customerId?: string
  customerEmail?: string
  metadata?: Record<string, string>
  successUrl: string
  cancelUrl: string
}) {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    customer: customerId,
    customer_email: customerEmail,
    metadata,
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
  })

  return session
}

/**
 * Create a Stripe Connect account link for photographer onboarding
 */
export async function createConnectAccountLink(accountId: string, returnUrl: string, refreshUrl: string) {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  })

  return accountLink
}

/**
 * Create a Stripe Connect account for a photographer
 */
export async function createConnectAccount(email: string, metadata?: Record<string, string>) {
  const account = await stripe.accounts.create({
    type: 'standard',
    email,
    metadata,
  })

  return account
}

/**
 * Transfer commission to photographer's connected account
 */
export async function transferCommissionToPhotographer({
  amount,
  photographerStripeAccountId,
  metadata,
}: {
  amount: number // Amount in cents
  photographerStripeAccountId: string
  metadata?: Record<string, string>
}) {
  const transfer = await stripe.transfers.create({
    amount,
    currency: 'usd',
    destination: photographerStripeAccountId,
    metadata,
  })

  return transfer
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  return subscription
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.cancel(subscriptionId)
  return subscription
}

/**
 * Get customer details
 */
export async function getCustomer(customerId: string) {
  const customer = await stripe.customers.retrieve(customerId)
  return customer
}

/**
 * Create or retrieve a customer
 */
export async function createOrRetrieveCustomer({
  email,
  userId,
  name,
}: {
  email: string
  userId: string
  name?: string
}) {
  // Check if customer already exists
  const customers = await stripe.customers.list({
    email,
    limit: 1,
  })

  if (customers.data.length > 0) {
    return customers.data[0]
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      userId,
    },
  })

  return customer
}

/**
 * Construct webhook event from raw body and signature
 * Used in webhook route to verify webhook authenticity
 */
export function constructWebhookEvent(
  rawBody: string | Buffer,
  signature: string,
  webhookSecret: string
) {
  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
}

/**
 * Calculate commission amount
 * @param amount - Payment amount in cents
 * @param commissionRate - Commission rate (default 50%)
 * @returns Commission amount in cents
 */
export function calculateCommission(amount: number, commissionRate: number = PHOTOGRAPHER_COMMISSION_RATE): number {
  return Math.round(amount * commissionRate)
}

/**
 * Format amount from cents to dollars
 */
export function formatAmount(amountInCents: number): string {
  return `$${(amountInCents / 100).toFixed(2)}`
}

/**
 * Convert dollars to cents
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100)
}


