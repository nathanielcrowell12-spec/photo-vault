/**
 * Stripe Webhook Types
 *
 * Shared types for all webhook handlers.
 * This file has NO external dependencies - type-only.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'

/**
 * Context passed to all webhook handlers
 */
export interface WebhookContext {
  supabase: SupabaseClient
  stripe: Stripe
  eventId: string
  eventType: string
}

/**
 * Standard result returned by all handlers
 */
export interface HandlerResult {
  success: boolean
  message: string
  data?: Record<string, unknown>
}

/**
 * Comprehensive metadata type for checkout sessions
 * Covers all checkout flows: gallery, tokens, subscription, family takeover, reactivation
 */
export interface CheckoutSessionMetadata {
  // Common fields
  user_id?: string
  type?: 'gallery_payment' | 'family_takeover' | 'reactivation'
  purchase_type?: 'tokens' | 'subscription'
  isPublicCheckout?: 'true' | 'false'

  // Gallery checkout fields
  galleryId?: string
  photographerId?: string
  clientId?: string
  clientEmail?: string
  clientName?: string
  galleryName?: string
  totalAmount?: string
  shootFee?: string
  storageFee?: string
  shootFeeCents?: string
  storageFeeCents?: string
  photovaultRevenueCents?: string
  photographerPayoutCents?: string
  paymentOptionId?: string
  payment_option_id?: string

  // Token purchase fields
  tokens?: string

  // Family takeover fields
  account_id?: string
  secondary_id?: string
  takeover_type?: 'full_primary' | 'billing_only'
  reason?: string
  reason_text?: string
  new_payer_user_id?: string
  previous_primary_id?: string

  // Reactivation fields
  stripe_subscription_id?: string
  gallery_id?: string
}

// Re-export commonly used Stripe types for convenience
export type { Stripe }
export type CheckoutSession = Stripe.Checkout.Session
export type Subscription = Stripe.Subscription
export type Invoice = Stripe.Invoice
export type Payout = Stripe.Payout
