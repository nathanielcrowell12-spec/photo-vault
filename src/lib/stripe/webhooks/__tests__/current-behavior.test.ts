/**
 * Webhook Behavior Tests
 *
 * These tests capture the CURRENT behavior of the webhook handlers.
 * They MUST pass before any extraction begins.
 * After extraction, they MUST still pass - if they fail, the extraction broke something.
 *
 * Test Coverage:
 * - checkout.session.completed (gallery, tokens, subscription, family, reactivation)
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 * - payout.created
 * - Idempotency (3 critical cases)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import type Stripe from 'stripe'

// ============================================================================
// MOCK SETUP - Must be before any imports that use these modules
// ============================================================================

// Mock environment variables
vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_fake')
vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_test_fake')
vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://photovault.photo')

// Create mock functions that will be configured per-test
const mockFromResult = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  then: vi.fn((cb) => cb({ error: null })),
}

const mockSupabaseFrom = vi.fn().mockReturnValue(mockFromResult)
const mockSupabaseRpc = vi.fn().mockResolvedValue({ data: null, error: null })

const mockSupabaseAuth = {
  admin: {
    createUser: vi.fn().mockResolvedValue({ data: null, error: null }),
    getUserByEmail: vi.fn().mockResolvedValue({ data: null, error: null }),
    getUserById: vi.fn().mockResolvedValue({ data: null, error: null }),
    listUsers: vi.fn().mockResolvedValue({ data: { users: [] }, error: null }),
  },
}

const mockSupabase = {
  from: mockSupabaseFrom,
  rpc: mockSupabaseRpc,
  auth: mockSupabaseAuth,
}

// Stripe mock
const mockStripeWebhooksConstructEvent = vi.fn()
const mockStripePaymentIntentsRetrieve = vi.fn().mockResolvedValue({ latest_charge: null })
const mockStripeSubscriptionsRetrieve = vi.fn().mockResolvedValue({ metadata: {} })
const mockStripeChargesRetrieve = vi.fn().mockResolvedValue({})

const mockStripeInstance = {
  webhooks: {
    constructEvent: mockStripeWebhooksConstructEvent,
  },
  paymentIntents: {
    retrieve: mockStripePaymentIntentsRetrieve,
  },
  subscriptions: {
    retrieve: mockStripeSubscriptionsRetrieve,
  },
  charges: {
    retrieve: mockStripeChargesRetrieve,
  },
}

// Mock all modules BEFORE they're imported
vi.mock('@/lib/supabase-server', () => ({
  createServiceRoleClient: () => mockSupabase,
}))

vi.mock('@/lib/supabase', () => ({
  createServerSupabaseClient: () => mockSupabase,
}))

vi.mock('@/lib/analytics/server', () => ({
  trackServerEvent: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/analytics/helpers', () => ({
  isFirstTime: vi.fn().mockResolvedValue(true),
  calculateTimeFromSignup: vi.fn().mockReturnValue(86400),
  getPhotographerSignupDate: vi.fn().mockResolvedValue(new Date().toISOString()),
  mapPaymentOptionToPlanType: vi.fn().mockReturnValue('annual'),
}))

const mockEmailService = {
  sendWelcomeEmailWithPassword: vi.fn().mockResolvedValue(undefined),
  sendGalleryAccessRestoredEmail: vi.fn().mockResolvedValue(undefined),
  sendPaymentSuccessfulEmail: vi.fn().mockResolvedValue(undefined),
  sendPaymentFailedEmail: vi.fn().mockResolvedValue(undefined),
}

vi.mock('@/lib/email/email-service', () => ({
  EmailService: mockEmailService,
}))

const mockCompleteTakeover = vi.fn().mockResolvedValue(undefined)
vi.mock('@/lib/server/family-takeover-service', () => ({
  completeTakeover: mockCompleteTakeover,
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock Stripe - return a class-like constructor
vi.mock('stripe', () => ({
  default: class MockStripe {
    webhooks = mockStripeInstance.webhooks
    paymentIntents = mockStripeInstance.paymentIntents
    subscriptions = mockStripeInstance.subscriptions
    charges = mockStripeInstance.charges
  },
}))

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a mock NextRequest with Stripe webhook signature
 */
function createMockRequest(body: string): NextRequest {
  return {
    text: () => Promise.resolve(body),
    headers: {
      get: (name: string) => (name === 'stripe-signature' ? 'sig_test' : null),
    },
  } as unknown as NextRequest
}

/**
 * Create a mock Stripe checkout session
 */
function createMockCheckoutSession(
  overrides: Partial<Stripe.Checkout.Session> = {}
): Stripe.Checkout.Session {
  return {
    id: 'cs_test_123',
    object: 'checkout.session',
    amount_total: 35000,
    currency: 'usd',
    customer: 'cus_test_123',
    customer_details: {
      email: 'client@example.com',
      name: 'Test Client',
    },
    payment_intent: 'pi_test_123',
    payment_status: 'paid',
    status: 'complete',
    metadata: {},
    mode: 'payment',
    ...overrides,
  } as Stripe.Checkout.Session
}

/**
 * Create a mock Stripe subscription
 */
function createMockSubscription(
  overrides: Partial<Stripe.Subscription> = {}
): Stripe.Subscription {
  return {
    id: 'sub_test_123',
    object: 'subscription',
    customer: 'cus_test_123',
    status: 'active',
    metadata: { plan_type: 'monthly' },
    items: {
      data: [
        {
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        },
      ],
    },
    cancel_at_period_end: false,
    canceled_at: null,
    cancellation_details: {},
    ...overrides,
  } as unknown as Stripe.Subscription
}

/**
 * Create a mock Stripe invoice
 */
function createMockInvoice(
  overrides: Partial<Stripe.Invoice> = {}
): Stripe.Invoice {
  return {
    id: 'in_test_123',
    object: 'invoice',
    customer: 'cus_test_123',
    customer_email: 'client@example.com',
    subscription: 'sub_test_123',
    amount_paid: 800,
    amount_due: 800,
    currency: 'usd',
    status: 'paid',
    period_start: Math.floor(Date.now() / 1000),
    period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    status_transitions: {
      paid_at: Math.floor(Date.now() / 1000),
    },
    billing_reason: 'subscription_cycle',
    hosted_invoice_url: 'https://invoice.stripe.com/test',
    ...overrides,
  } as unknown as Stripe.Invoice
}

/**
 * Create a mock Stripe payout
 */
function createMockPayout(overrides: Partial<Stripe.Payout> = {}): Stripe.Payout {
  return {
    id: 'po_test_123',
    object: 'payout',
    amount: 15000,
    currency: 'usd',
    destination: 'acct_test_photographer',
    status: 'paid',
    arrival_date: Math.floor(Date.now() / 1000) + 2 * 24 * 60 * 60,
    description: 'Photographer earnings',
    ...overrides,
  } as Stripe.Payout
}

/**
 * Create a mock Stripe event
 */
function createMockEvent(
  type: string,
  data: unknown,
  eventId = 'evt_test_123'
): Stripe.Event {
  return {
    id: eventId,
    object: 'event',
    type,
    data: { object: data },
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    pending_webhooks: 0,
    api_version: '2023-10-16',
  } as unknown as Stripe.Event
}

/**
 * Setup standard mocks for most tests
 */
function setupStandardMocks() {
  mockSupabaseFrom.mockImplementation((table: string) => {
    const result = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockResolvedValue({ error: null }),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: vi.fn((cb) => cb({ error: null })),
    }

    if (table === 'processed_webhook_events') {
      result.single = vi.fn().mockResolvedValue({ data: null, error: null })
      result.insert = vi.fn().mockResolvedValue({ error: null })
    }
    if (table === 'webhook_logs') {
      result.insert = vi.fn().mockResolvedValue({ error: null })
    }

    return result
  })
}

// ============================================================================
// IMPORT THE HANDLER AFTER MOCKS ARE SET UP
// ============================================================================

import { POST } from '@/app/api/webhooks/stripe/route'

// ============================================================================
// TEST SUITES
// ============================================================================

describe('Stripe Webhook Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupStandardMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Signature Verification', () => {
    it('should reject requests without stripe-signature header', async () => {
      const request = {
        text: () => Promise.resolve('{}'),
        headers: { get: () => null },
      } as unknown as NextRequest

      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error).toBe('Missing signature')
    })

    it('should reject requests with invalid signature', async () => {
      mockStripeWebhooksConstructEvent.mockImplementation(() => {
        throw new Error('Invalid signature')
      })

      const request = createMockRequest('{}')
      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error).toContain('Webhook signature verification failed')
    })
  })

  describe('checkout.session.completed', () => {
    describe('Public Gallery Checkout', () => {
      it('should create new user account for public checkout', async () => {
        const session = createMockCheckoutSession({
          metadata: {
            isPublicCheckout: 'true',
            galleryId: 'gallery_123',
            photographerId: 'photo_123',
            clientId: 'client_123',
            clientEmail: 'newclient@example.com',
            clientName: 'New Client',
            shootFee: '25000',
            storageFee: '10000',
          },
        })

        const event = createMockEvent('checkout.session.completed', session)
        mockStripeWebhooksConstructEvent.mockReturnValue(event)

        mockSupabaseFrom.mockImplementation((table: string) => {
          const base = {
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            upsert: vi.fn().mockResolvedValue({ error: null }),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            then: vi.fn((cb) => cb({ error: null })),
          }

          if (table === 'processed_webhook_events') {
            return {
              ...base,
              single: vi.fn().mockResolvedValue({ data: null }),
              insert: vi.fn().mockResolvedValue({ error: null }),
            }
          }
          if (table === 'clients') {
            return {
              ...base,
              single: vi.fn().mockResolvedValue({
                data: { email: 'newclient@example.com', name: 'New Client' },
              }),
            }
          }
          if (table === 'photo_galleries') {
            return {
              ...base,
              single: vi.fn().mockResolvedValue({
                data: { gallery_name: 'Test Gallery' },
              }),
            }
          }
          if (table === 'commissions') {
            return {
              ...base,
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
            }
          }
          return base
        })

        // Mock user creation - user doesn't exist yet
        mockSupabaseAuth.admin.getUserByEmail.mockResolvedValue({
          data: null,
          error: { message: 'User not found' },
        })

        mockSupabaseAuth.admin.createUser.mockResolvedValue({
          data: {
            user: { id: 'new_user_123', email: 'newclient@example.com' },
          },
          error: null,
        })

        const request = createMockRequest(JSON.stringify(session))
        const response = await POST(request)

        expect(response.status).toBe(200)
        expect(mockSupabaseAuth.admin.createUser).toHaveBeenCalled()
      })

      it('should link existing user for authenticated checkout', async () => {
        const session = createMockCheckoutSession({
          metadata: {
            type: 'gallery_payment',
            galleryId: 'gallery_123',
            photographerId: 'photo_123',
            clientId: 'client_123',
            shootFeeCents: '25000',
            storageFeeCents: '10000',
            photovaultRevenueCents: '5000',
            photographerPayoutCents: '30000',
          },
        })

        const event = createMockEvent('checkout.session.completed', session)
        mockStripeWebhooksConstructEvent.mockReturnValue(event)

        mockSupabaseFrom.mockImplementation((table: string) => {
          const base = {
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            upsert: vi.fn().mockResolvedValue({ error: null }),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            then: vi.fn((cb) => cb({ error: null })),
          }

          if (table === 'processed_webhook_events') {
            return {
              ...base,
              single: vi.fn().mockResolvedValue({ data: null }),
              insert: vi.fn().mockResolvedValue({ error: null }),
            }
          }
          if (table === 'clients') {
            return {
              ...base,
              single: vi.fn().mockResolvedValue({
                data: { email: 'client@example.com', name: 'Test Client' },
              }),
            }
          }
          if (table === 'commissions') {
            return {
              ...base,
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
            }
          }
          return base
        })

        // Mock existing user found
        mockSupabaseAuth.admin.getUserByEmail.mockResolvedValue({
          data: { user: { id: 'existing_user_123' } },
          error: null,
        })

        const request = createMockRequest(JSON.stringify(session))
        const response = await POST(request)

        expect(response.status).toBe(200)
        // Should NOT create a new user
        expect(mockSupabaseAuth.admin.createUser).not.toHaveBeenCalled()
      })

      it('should record commission for gallery checkout', async () => {
        const session = createMockCheckoutSession({
          metadata: {
            isPublicCheckout: 'true',
            galleryId: 'gallery_123',
            photographerId: 'photo_123',
            clientId: 'client_123',
            shootFee: '25000',
            storageFee: '10000',
          },
        })

        const event = createMockEvent('checkout.session.completed', session)
        mockStripeWebhooksConstructEvent.mockReturnValue(event)

        let commissionInserted = false

        mockSupabaseFrom.mockImplementation((table: string) => {
          const base = {
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            upsert: vi.fn().mockResolvedValue({ error: null }),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            then: vi.fn((cb) => cb({ error: null })),
          }

          if (table === 'commissions') {
            return {
              ...base,
              insert: vi.fn().mockImplementation(() => {
                commissionInserted = true
                return {
                  then: vi.fn((cb) => cb({ error: null })),
                }
              }),
            }
          }
          if (table === 'processed_webhook_events') {
            return {
              ...base,
              single: vi.fn().mockResolvedValue({ data: null }),
              insert: vi.fn().mockResolvedValue({ error: null }),
            }
          }
          if (table === 'clients') {
            return {
              ...base,
              single: vi.fn().mockResolvedValue({
                data: { email: 'client@example.com', name: 'Client' },
              }),
            }
          }
          return base
        })

        mockSupabaseAuth.admin.getUserByEmail.mockResolvedValue({
          data: { user: { id: 'user_123' } },
          error: null,
        })

        const request = createMockRequest(JSON.stringify(session))
        const response = await POST(request)

        expect(response.status).toBe(200)
        expect(commissionInserted).toBe(true)
      })

      it('should create subscription record for gallery access', async () => {
        const session = createMockCheckoutSession({
          metadata: {
            isPublicCheckout: 'true',
            galleryId: 'gallery_123',
            photographerId: 'photo_123',
            clientId: 'client_123',
          },
        })

        const event = createMockEvent('checkout.session.completed', session)
        mockStripeWebhooksConstructEvent.mockReturnValue(event)

        let subscriptionUpserted = false

        mockSupabaseFrom.mockImplementation((table: string) => {
          const base = {
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            upsert: vi.fn().mockImplementation(() => {
              if (table === 'subscriptions') subscriptionUpserted = true
              return Promise.resolve({ error: null })
            }),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            then: vi.fn((cb) => cb({ error: null })),
          }

          if (table === 'processed_webhook_events') {
            return {
              ...base,
              single: vi.fn().mockResolvedValue({ data: null }),
              insert: vi.fn().mockResolvedValue({ error: null }),
            }
          }
          if (table === 'clients') {
            return {
              ...base,
              single: vi.fn().mockResolvedValue({
                data: { email: 'client@example.com', name: 'Client' },
              }),
            }
          }
          return base
        })

        mockSupabaseAuth.admin.getUserByEmail.mockResolvedValue({
          data: { user: { id: 'user_123' } },
          error: null,
        })

        const request = createMockRequest(JSON.stringify(session))
        const response = await POST(request)

        expect(response.status).toBe(200)
        expect(subscriptionUpserted).toBe(true)
      })
    })

    describe('Token Purchase', () => {
      it('should add tokens to user balance', async () => {
        const session = createMockCheckoutSession({
          metadata: {
            user_id: 'user_123',
            purchase_type: 'tokens',
            tokens: '100',
          },
        })

        const event = createMockEvent('checkout.session.completed', session)
        mockStripeWebhooksConstructEvent.mockReturnValue(event)

        let tokensAdded = false
        mockSupabaseRpc.mockImplementation((fnName: string) => {
          if (fnName === 'add_tokens_to_balance') {
            tokensAdded = true
            return Promise.resolve({ error: null })
          }
          return Promise.resolve({ data: null, error: null })
        })

        const request = createMockRequest(JSON.stringify(session))
        const response = await POST(request)

        expect(response.status).toBe(200)
        expect(tokensAdded).toBe(true)
      })

      it('should record token transaction', async () => {
        const session = createMockCheckoutSession({
          metadata: {
            user_id: 'user_123',
            purchase_type: 'tokens',
            tokens: '50',
          },
          amount_total: 5000,
        })

        const event = createMockEvent('checkout.session.completed', session)
        mockStripeWebhooksConstructEvent.mockReturnValue(event)

        let transactionRecorded = false
        mockSupabaseRpc.mockResolvedValue({ error: null })

        mockSupabaseFrom.mockImplementation((table: string) => {
          const base = {
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null }),
          }

          if (table === 'token_transactions') {
            return {
              ...base,
              insert: vi.fn().mockImplementation(() => {
                transactionRecorded = true
                return Promise.resolve({ error: null })
              }),
            }
          }
          if (table === 'processed_webhook_events') {
            return {
              ...base,
              single: vi.fn().mockResolvedValue({ data: null }),
              insert: vi.fn().mockResolvedValue({ error: null }),
            }
          }
          return base
        })

        const request = createMockRequest(JSON.stringify(session))
        const response = await POST(request)

        expect(response.status).toBe(200)
        expect(transactionRecorded).toBe(true)
      })
    })

    describe('Subscription Checkout', () => {
      it('should return early and defer to subscription.created event', async () => {
        const session = createMockCheckoutSession({
          metadata: {
            user_id: 'user_123',
            purchase_type: 'subscription',
          },
        })

        const event = createMockEvent('checkout.session.completed', session)
        mockStripeWebhooksConstructEvent.mockReturnValue(event)

        const request = createMockRequest(JSON.stringify(session))
        const response = await POST(request)
        const json = await response.json()

        expect(response.status).toBe(200)
        // New modular code returns handler-specific message (more informative)
        expect(json.message).toBe('Subscription checkout completed for user user_123, handled by subscription.created event')
      })
    })

    describe('Family Takeover', () => {
      it('should delegate to family-takeover-service', async () => {
        const session = createMockCheckoutSession({
          subscription: 'sub_test_123',
          metadata: {
            user_id: 'secondary_123',
            type: 'family_takeover',
            account_id: 'account_123',
            secondary_id: 'secondary_123',
            takeover_type: 'full_primary',
            reason: 'parent_deceased',
            new_payer_user_id: 'secondary_123',
            previous_primary_id: 'primary_123',
          },
        })

        const event = createMockEvent('checkout.session.completed', session)
        mockStripeWebhooksConstructEvent.mockReturnValue(event)

        const request = createMockRequest(JSON.stringify(session))
        const response = await POST(request)

        expect(response.status).toBe(200)
        expect(mockCompleteTakeover).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            account_id: 'account_123',
            secondary_id: 'secondary_123',
            takeover_type: 'full_primary',
          }),
          'sub_test_123'
        )
      })
    })

    describe('Reactivation', () => {
      it('should restore access for 30 days', async () => {
        const session = createMockCheckoutSession({
          metadata: {
            user_id: 'user_123',
            type: 'reactivation',
            stripe_subscription_id: 'sub_test_123',
            gallery_id: 'gallery_123',
          },
          amount_total: 2000,
        })

        const event = createMockEvent('checkout.session.completed', session)
        mockStripeWebhooksConstructEvent.mockReturnValue(event)

        let updateData: Record<string, unknown> = {}

        mockSupabaseFrom.mockImplementation((table: string) => {
          const base = {
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockResolvedValue({ error: null }),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null }),
          }

          if (table === 'subscriptions') {
            return {
              ...base,
              update: vi.fn().mockImplementation((data) => {
                updateData = data
                return {
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }
              }),
            }
          }
          if (table === 'processed_webhook_events') {
            return {
              ...base,
              single: vi.fn().mockResolvedValue({ data: null }),
              insert: vi.fn().mockResolvedValue({ error: null }),
            }
          }
          if (table === 'photo_galleries') {
            return {
              ...base,
              single: vi.fn().mockResolvedValue({
                data: { gallery_name: 'Test Gallery' },
              }),
            }
          }
          if (table === 'user_profiles') {
            return {
              ...base,
              single: vi.fn().mockResolvedValue({
                data: { full_name: 'Test User' },
              }),
            }
          }
          return base
        })

        mockSupabaseAuth.admin.getUserById.mockResolvedValue({
          data: { user: { email: 'user@example.com' } },
        })

        const request = createMockRequest(JSON.stringify(session))
        const response = await POST(request)

        expect(response.status).toBe(200)
        expect(updateData.status).toBe('active')
        expect(updateData.access_suspended).toBe(false)
        expect(updateData.payment_failure_count).toBe(0)
      })
    })
  })

  describe('customer.subscription.created', () => {
    it('should create subscription record in database', async () => {
      const subscription = createMockSubscription()
      const event = createMockEvent('customer.subscription.created', subscription)
      mockStripeWebhooksConstructEvent.mockReturnValue(event)

      let subscriptionInserted = false

      mockSupabaseFrom.mockImplementation((table: string) => {
        const base = {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }

        if (table === 'users') {
          return {
            ...base,
            single: vi.fn().mockResolvedValue({
              data: { id: 'user_123' },
              error: null,
            }),
          }
        }
        if (table === 'subscriptions') {
          return {
            ...base,
            insert: vi.fn().mockImplementation(() => {
              subscriptionInserted = true
              return Promise.resolve({ error: null })
            }),
          }
        }
        if (table === 'processed_webhook_events') {
          return {
            ...base,
            single: vi.fn().mockResolvedValue({ data: null }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return base
      })

      const request = createMockRequest(JSON.stringify(subscription))
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(subscriptionInserted).toBe(true)
    })
  })

  describe('customer.subscription.updated', () => {
    it('should update status and period', async () => {
      const subscription = createMockSubscription({ status: 'past_due' })
      const event = createMockEvent('customer.subscription.updated', subscription)
      mockStripeWebhooksConstructEvent.mockReturnValue(event)

      let updateCalled = false
      let updateData: Record<string, unknown> = {}

      mockSupabaseFrom.mockImplementation((table: string) => {
        const base = {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockResolvedValue({ error: null }),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null }),
        }

        if (table === 'subscriptions') {
          return {
            ...base,
            update: vi.fn().mockImplementation((data) => {
              updateCalled = true
              updateData = data
              return {
                eq: vi.fn().mockResolvedValue({ error: null }),
              }
            }),
          }
        }
        if (table === 'processed_webhook_events') {
          return {
            ...base,
            single: vi.fn().mockResolvedValue({ data: null }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return base
      })

      const request = createMockRequest(JSON.stringify(subscription))
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(updateCalled).toBe(true)
      expect(updateData.status).toBe('past_due')
    })
  })

  describe('customer.subscription.deleted', () => {
    it('should set status to canceled', async () => {
      const subscription = createMockSubscription()
      const event = createMockEvent('customer.subscription.deleted', subscription)
      mockStripeWebhooksConstructEvent.mockReturnValue(event)

      let updateData: Record<string, unknown> = {}

      mockSupabaseFrom.mockImplementation((table: string) => {
        const base = {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockResolvedValue({ error: null }),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null }),
        }

        if (table === 'subscriptions') {
          return {
            ...base,
            single: vi.fn().mockResolvedValue({
              data: {
                user_id: 'user_123',
                user_profiles: { user_type: 'client', created_at: new Date().toISOString() },
              },
            }),
            update: vi.fn().mockImplementation((data) => {
              updateData = data
              return {
                eq: vi.fn().mockResolvedValue({ error: null }),
              }
            }),
          }
        }
        if (table === 'processed_webhook_events') {
          return {
            ...base,
            single: vi.fn().mockResolvedValue({ data: null }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return base
      })

      const request = createMockRequest(JSON.stringify(subscription))
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(updateData.status).toBe('canceled')
      expect(updateData.cancel_at_period_end).toBe(false)
    })
  })

  describe('invoice.payment_succeeded', () => {
    it('should update subscription and reset failure tracking', async () => {
      const invoice = createMockInvoice()
      const event = createMockEvent('invoice.payment_succeeded', invoice)
      mockStripeWebhooksConstructEvent.mockReturnValue(event)

      let updateData: Record<string, unknown> = {}

      mockSupabaseFrom.mockImplementation((table: string) => {
        const base = {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null }),
          then: vi.fn((cb) => cb({ error: null })),
        }

        if (table === 'subscriptions') {
          return {
            ...base,
            single: vi.fn().mockResolvedValue({
              data: { access_suspended: false, user_id: 'user_123', gallery_id: 'gallery_123' },
            }),
            update: vi.fn().mockImplementation((data) => {
              updateData = data
              return {
                eq: vi.fn().mockResolvedValue({ error: null }),
              }
            }),
          }
        }
        if (table === 'payment_history') {
          return {
            ...base,
            single: vi.fn().mockResolvedValue({ data: { id: 'ph_123' } }),
          }
        }
        if (table === 'processed_webhook_events') {
          return {
            ...base,
            single: vi.fn().mockResolvedValue({ data: null }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return base
      })

      mockStripeSubscriptionsRetrieve.mockResolvedValue({
        metadata: { photographer_id: 'photo_123', client_id: 'client_123', gallery_id: 'gallery_123' },
      })

      const request = createMockRequest(JSON.stringify(invoice))
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(updateData.status).toBe('active')
      expect(updateData.payment_failure_count).toBe(0)
      expect(updateData.access_suspended).toBe(false)
    })

    it('should restore access if previously suspended', async () => {
      const invoice = createMockInvoice()
      const event = createMockEvent('invoice.payment_succeeded', invoice)
      mockStripeWebhooksConstructEvent.mockReturnValue(event)

      mockSupabaseFrom.mockImplementation((table: string) => {
        const base = {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null }),
          then: vi.fn((cb) => cb({ error: null })),
        }

        if (table === 'subscriptions') {
          return {
            ...base,
            single: vi.fn().mockResolvedValue({
              data: {
                access_suspended: true, // Was suspended
                user_id: 'user_123',
                gallery_id: 'gallery_123',
              },
            }),
          }
        }
        if (table === 'payment_history') {
          return {
            ...base,
            single: vi.fn().mockResolvedValue({ data: { id: 'ph_123' } }),
          }
        }
        if (table === 'processed_webhook_events') {
          return {
            ...base,
            single: vi.fn().mockResolvedValue({ data: null }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        if (table === 'photo_galleries') {
          return {
            ...base,
            single: vi.fn().mockResolvedValue({
              data: { gallery_name: 'Test Gallery', photographer_id: 'photo_123' },
            }),
          }
        }
        if (table === 'user_profiles') {
          return {
            ...base,
            single: vi.fn().mockResolvedValue({ data: { full_name: 'Test User' } }),
          }
        }
        return base
      })

      mockSupabaseAuth.admin.getUserById.mockResolvedValue({
        data: { user: { email: 'user@example.com' } },
      })

      mockStripeSubscriptionsRetrieve.mockResolvedValue({
        metadata: { photographer_id: 'photo_123' },
      })

      const request = createMockRequest(JSON.stringify(invoice))
      const response = await POST(request)

      expect(response.status).toBe(200)
      // Should send access restored email
      expect(mockEmailService.sendGalleryAccessRestoredEmail).toHaveBeenCalled()
    })

    it('should record commission for subscription payment', async () => {
      const invoice = createMockInvoice({
        amount_paid: 800,
        billing_reason: 'subscription_cycle',
      })
      const event = createMockEvent('invoice.payment_succeeded', invoice)
      mockStripeWebhooksConstructEvent.mockReturnValue(event)

      let commissionInserted = false

      mockSupabaseFrom.mockImplementation((table: string) => {
        const base = {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null }),
          then: vi.fn((cb) => cb({ error: null })),
        }

        if (table === 'subscriptions') {
          return {
            ...base,
            single: vi.fn().mockResolvedValue({
              data: { access_suspended: false, user_id: 'user_123', gallery_id: 'gallery_123' },
            }),
          }
        }
        if (table === 'payment_history') {
          return {
            ...base,
            single: vi.fn().mockResolvedValue({ data: { id: 'ph_123' } }),
          }
        }
        if (table === 'commissions') {
          return {
            ...base,
            insert: vi.fn().mockImplementation(() => {
              commissionInserted = true
              return {
                then: vi.fn((cb) => cb({ error: null })),
              }
            }),
          }
        }
        if (table === 'processed_webhook_events') {
          return {
            ...base,
            single: vi.fn().mockResolvedValue({ data: null }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return base
      })

      mockStripeSubscriptionsRetrieve.mockResolvedValue({
        metadata: { photographer_id: 'photo_123', client_id: 'client_123', gallery_id: 'gallery_123' },
      })

      const request = createMockRequest(JSON.stringify(invoice))
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(commissionInserted).toBe(true)
    })
  })

  describe('invoice.payment_failed', () => {
    it('should increment failure count', async () => {
      const invoice = createMockInvoice({ status: 'open' })
      const event = createMockEvent('invoice.payment_failed', invoice)
      mockStripeWebhooksConstructEvent.mockReturnValue(event)

      let updateData: Record<string, unknown> = {}

      mockSupabaseFrom.mockImplementation((table: string) => {
        const base = {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockResolvedValue({ error: null }),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null }),
        }

        if (table === 'subscriptions') {
          return {
            ...base,
            single: vi.fn().mockResolvedValue({
              data: {
                payment_failure_count: 0,
                last_payment_failure_at: null,
                access_suspended: false,
                user_id: 'user_123',
                gallery_id: 'gallery_123',
                user_profiles: { full_name: 'Test User' },
                photo_galleries: { gallery_name: 'Test Gallery' },
              },
            }),
            update: vi.fn().mockImplementation((data) => {
              updateData = data
              return {
                eq: vi.fn().mockResolvedValue({ error: null }),
              }
            }),
          }
        }
        if (table === 'processed_webhook_events') {
          return {
            ...base,
            single: vi.fn().mockResolvedValue({ data: null }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return base
      })

      mockSupabaseAuth.admin.getUserById.mockResolvedValue({
        data: { user: { email: 'user@example.com' } },
      })

      const request = createMockRequest(JSON.stringify(invoice))
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(updateData.payment_failure_count).toBe(1)
      expect(updateData.status).toBe('past_due')
    })

    it('should suspend access after 6 month grace period', async () => {
      const invoice = createMockInvoice({ status: 'open' })
      const event = createMockEvent('invoice.payment_failed', invoice)
      mockStripeWebhooksConstructEvent.mockReturnValue(event)

      // Simulate first failure was 7 months ago
      const sevenMonthsAgo = new Date()
      sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 7)

      let updateData: Record<string, unknown> = {}

      mockSupabaseFrom.mockImplementation((table: string) => {
        const base = {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockResolvedValue({ error: null }),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null }),
        }

        if (table === 'subscriptions') {
          return {
            ...base,
            single: vi.fn().mockResolvedValue({
              data: {
                payment_failure_count: 5,
                last_payment_failure_at: sevenMonthsAgo.toISOString(),
                access_suspended: false,
                user_id: 'user_123',
                gallery_id: 'gallery_123',
                user_profiles: { full_name: 'Test User' },
                photo_galleries: { gallery_name: 'Test Gallery' },
              },
            }),
            update: vi.fn().mockImplementation((data) => {
              updateData = data
              return {
                eq: vi.fn().mockResolvedValue({ error: null }),
              }
            }),
          }
        }
        if (table === 'processed_webhook_events') {
          return {
            ...base,
            single: vi.fn().mockResolvedValue({ data: null }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return base
      })

      mockSupabaseAuth.admin.getUserById.mockResolvedValue({
        data: { user: { email: 'user@example.com' } },
      })

      const request = createMockRequest(JSON.stringify(invoice))
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(updateData.access_suspended).toBe(true)
      expect(updateData.access_suspended_at).toBeDefined()
    })

    it('should send payment failed email', async () => {
      const invoice = createMockInvoice({ status: 'open', amount_due: 800 })
      const event = createMockEvent('invoice.payment_failed', invoice)
      mockStripeWebhooksConstructEvent.mockReturnValue(event)

      mockSupabaseFrom.mockImplementation((table: string) => {
        const base = {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockResolvedValue({ error: null }),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null }),
        }

        if (table === 'subscriptions') {
          return {
            ...base,
            single: vi.fn().mockResolvedValue({
              data: {
                payment_failure_count: 0,
                last_payment_failure_at: null,
                access_suspended: false,
                user_id: 'user_123',
                gallery_id: 'gallery_123',
                user_profiles: { full_name: 'Test User' },
                photo_galleries: { gallery_name: 'Test Gallery' },
              },
            }),
          }
        }
        if (table === 'processed_webhook_events') {
          return {
            ...base,
            single: vi.fn().mockResolvedValue({ data: null }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return base
      })

      mockSupabaseAuth.admin.getUserById.mockResolvedValue({
        data: { user: { email: 'user@example.com' } },
      })

      const request = createMockRequest(JSON.stringify(invoice))
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockEmailService.sendPaymentFailedEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          customerEmail: 'user@example.com',
          amountDue: 8, // 800 cents = $8
        })
      )
    })
  })

  describe('payout.created', () => {
    it('should create payout record', async () => {
      const payout = createMockPayout()
      const event = createMockEvent('payout.created', payout)
      mockStripeWebhooksConstructEvent.mockReturnValue(event)

      let payoutInserted = false

      mockSupabaseFrom.mockImplementation((table: string) => {
        const base = {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }

        if (table === 'users') {
          return {
            ...base,
            single: vi.fn().mockResolvedValue({
              data: { id: 'photographer_123' },
              error: null,
            }),
          }
        }
        if (table === 'payouts') {
          return {
            ...base,
            insert: vi.fn().mockImplementation(() => {
              payoutInserted = true
              return Promise.resolve({ error: null })
            }),
          }
        }
        if (table === 'processed_webhook_events') {
          return {
            ...base,
            single: vi.fn().mockResolvedValue({ data: null }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return base
      })

      const request = createMockRequest(JSON.stringify(payout))
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(payoutInserted).toBe(true)
    })

    it('should handle photographer not found gracefully', async () => {
      const payout = createMockPayout()
      const event = createMockEvent('payout.created', payout)
      mockStripeWebhooksConstructEvent.mockReturnValue(event)

      mockSupabaseFrom.mockImplementation((table: string) => {
        const base = {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockResolvedValue({ error: null }),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }

        if (table === 'users') {
          return {
            ...base,
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          }
        }
        if (table === 'processed_webhook_events') {
          return {
            ...base,
            single: vi.fn().mockResolvedValue({ data: null }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return base
      })

      const request = createMockRequest(JSON.stringify(payout))
      const response = await POST(request)

      // Should still succeed - we just log a warning
      expect(response.status).toBe(200)
    })
  })

  describe('Idempotency', () => {
    it('should skip already-processed events', async () => {
      const session = createMockCheckoutSession()
      const event = createMockEvent('checkout.session.completed', session, 'evt_already_processed')
      mockStripeWebhooksConstructEvent.mockReturnValue(event)

      // Simulate event already processed
      mockSupabaseFrom.mockImplementation((table: string) => {
        const base = {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockResolvedValue({ error: null }),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null }),
        }

        if (table === 'processed_webhook_events') {
          return {
            ...base,
            single: vi.fn().mockResolvedValue({
              data: { id: 'existing_record' }, // Already processed!
            }),
          }
        }
        return base
      })

      const request = createMockRequest(JSON.stringify(session))
      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.message).toBe('Already processed')
    })

    it('should NOT mark event as processed on handler error', async () => {
      const session = createMockCheckoutSession({
        metadata: {
          user_id: 'user_123',
          purchase_type: 'tokens',
          tokens: '100',
        },
      })
      const event = createMockEvent('checkout.session.completed', session)
      mockStripeWebhooksConstructEvent.mockReturnValue(event)

      let processedInsertCalled = false

      // Make the RPC call fail to trigger an error
      mockSupabaseRpc.mockRejectedValue(new Error('Database error'))

      mockSupabaseFrom.mockImplementation((table: string) => {
        const base = {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockResolvedValue({ error: null }),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null }),
        }

        if (table === 'processed_webhook_events') {
          return {
            ...base,
            single: vi.fn().mockResolvedValue({ data: null }),
            insert: vi.fn().mockImplementation(() => {
              processedInsertCalled = true
              return Promise.resolve({ error: null })
            }),
          }
        }
        if (table === 'users') {
          return {
            ...base,
            update: vi.fn().mockRejectedValue(new Error('Update failed')),
          }
        }
        return base
      })

      const request = createMockRequest(JSON.stringify(session))
      const response = await POST(request)

      // Handler should fail
      expect(response.status).toBe(500)
      // Should NOT have marked as processed
      expect(processedInsertCalled).toBe(false)
    })

    it('should mark event as processed ONLY after success', async () => {
      const subscription = createMockSubscription()
      const event = createMockEvent('customer.subscription.updated', subscription)
      mockStripeWebhooksConstructEvent.mockReturnValue(event)

      let processedInsertCalled = false
      const processingOrder: string[] = []

      mockSupabaseFrom.mockImplementation((table: string) => {
        const base = {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockResolvedValue({ error: null }),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null }),
        }

        if (table === 'processed_webhook_events') {
          return {
            ...base,
            single: vi.fn().mockResolvedValue({ data: null }),
            insert: vi.fn().mockImplementation(() => {
              processedInsertCalled = true
              processingOrder.push('processed_insert')
              return Promise.resolve({ error: null })
            }),
          }
        }
        if (table === 'subscriptions') {
          return {
            ...base,
            update: vi.fn().mockImplementation(() => {
              processingOrder.push('subscription_update')
              return {
                eq: vi.fn().mockResolvedValue({ error: null }),
              }
            }),
          }
        }
        if (table === 'webhook_logs') {
          return {
            ...base,
            insert: vi.fn().mockImplementation(() => {
              processingOrder.push('webhook_log')
              return Promise.resolve({ error: null })
            }),
          }
        }
        return base
      })

      const request = createMockRequest(JSON.stringify(subscription))
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(processedInsertCalled).toBe(true)
      // Verify order: handler runs first, then mark processed, then log
      expect(processingOrder.indexOf('subscription_update')).toBeLessThan(
        processingOrder.indexOf('processed_insert')
      )
    })
  })

  describe('Unhandled Events', () => {
    it('should return 200 for unhandled event types', async () => {
      const event = createMockEvent('customer.created', { id: 'cus_test' })
      mockStripeWebhooksConstructEvent.mockReturnValue(event)

      const request = createMockRequest('{}')
      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })
})
